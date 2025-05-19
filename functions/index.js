const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp();

/**
 * Cloud Function to load scraped data into Firebase Realtime Database
 * Can be triggered via HTTP request or scheduled to run once a year
 */
exports.loadCatalogueData = functions.https.onRequest(async (req, res) => {
  try {
    // Check for authentication token if provided
    const authHeader = req.get('Authorization');
    if (authHeader) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        console.error('Invalid auth token:', error);
        res.status(403).send('Unauthorized');
        return;
      }
    } else if (req.method !== 'POST' || req.get('X-Admin-Key') !== functions.config().admin?.key) {
      // If not authenticated with token, require admin key or scheduled invocation
      res.status(403).send('Unauthorized');
      return;
    }

    // Load data from JSON files
    let majors = [];
    let modules = [];

    try {
      majors = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/majors.json'), 'utf8')
      );
      
      modules = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/modules.json'), 'utf8')
      );
    } catch (error) {
      // If reading from file system fails, try to read from storage bucket
      console.log('Reading from local files failed, trying storage bucket...');
      const bucket = admin.storage().bucket();
      
      const [majorsFile] = await bucket.file('catalogue/majors.json').download();
      const [modulesFile] = await bucket.file('catalogue/modules.json').download();
      
      majors = JSON.parse(majorsFile.toString('utf8'));
      modules = JSON.parse(modulesFile.toString('utf8'));
    }

    console.log(`Loaded ${majors.length} majors and ${modules.length} modules`);

    // Prepare batch updates for Realtime Database
    const db = admin.database();
    const updates = {};

    // Process majors
    majors.forEach(major => {
      if (major.code) {
        updates[`majors/${major.code}`] = {
          name: major.name,
          code: major.code,
          academicYear: major.academicYear || '2025/6',
          type: major.type || 'undergraduate',
          description: major.description || '',
          lastUpdated: admin.database.ServerValue.TIMESTAMP
        };
      }
    });

    // Process modules
    modules.forEach(module => {
      if (module.code) {
        // Create a clean module object
        const moduleData = {
          code: module.code,
          title: module.title,
          credits: module.credits || 0,
          level: module.level || '',
          description: module.description || '',
          prerequisites: module.prerequisites || '',
          assessment: module.assessment || '',
          majorCode: module.majorCode || '',
          lastUpdated: admin.database.ServerValue.TIMESTAMP
        };

        // Add module to database
        updates[`modules/${module.code}`] = moduleData;

        // Create relationship between modules and majors
        if (module.majorCode) {
          if (!updates[`majors/${module.majorCode}/modules`]) {
            updates[`majors/${module.majorCode}/modules`] = {};
          }
          updates[`majors/${module.majorCode}/modules/${module.code}`] = true;
        }
      }
    });

    // Execute the batch update
    await db.ref().update(updates);

    // Update the lastUpdated timestamp
    await db.ref('metadata/catalogue').set({
      lastUpdated: admin.database.ServerValue.TIMESTAMP,
      recordCount: {
        majors: majors.length,
        modules: modules.length
      }
    });

    res.status(200).send({
      success: true,
      message: 'Catalogue data loaded successfully',
      stats: {
        majors: majors.length,
        modules: modules.length
      }
    });

  } catch (error) {
    console.error('Error loading catalogue data:', error);
    res.status(500).send({
      success: false,
      message: `Error loading catalogue data: ${error.message}`
    });
  }
});

/**
 * Scheduled function to verify data integrity once a day
 * Checks if all module references in majors exist, etc.
 */
exports.verifyCatalogueIntegrity = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Europe/London')
  .onRun(async (context) => {
    const db = admin.database();
    
    try {
      // Get all modules and majors
      const modulesSnapshot = await db.ref('modules').once('value');
      const majorsSnapshot = await db.ref('majors').once('value');
      
      const modules = modulesSnapshot.val() || {};
      const majors = majorsSnapshot.val() || {};
      
      console.log(`Checking integrity of ${Object.keys(modules).length} modules and ${Object.keys(majors).length} majors`);
      
      // Check if all modules referenced in majors exist
      const updates = {};
      let repairsNeeded = 0;
      
      Object.entries(majors).forEach(([majorCode, major]) => {
        if (major.modules) {
          Object.keys(major.modules).forEach(moduleCode => {
            if (!modules[moduleCode]) {
              console.log(`Repairing: Module ${moduleCode} referenced in major ${majorCode} doesn't exist`);
              updates[`majors/${majorCode}/modules/${moduleCode}`] = null;
              repairsNeeded++;
            }
          });
        }
      });
      
      // Apply repairs if needed
      if (repairsNeeded > 0) {
        await db.ref().update(updates);
        console.log(`Applied ${repairsNeeded} repairs to the catalogue`);
      } else {
        console.log('No integrity issues found');
      }
      
      return null;
    } catch (error) {
      console.error('Error in integrity verification:', error);
      return null;
    }
  });

// Optional: Add an API endpoint to get all study groups for a module
exports.getModuleStudyGroups = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'You must be logged in to view study groups'
    );
  }
  
  const moduleCode = data.moduleCode;
  
  if (!moduleCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Module code is required'
    );
  }
  
  try {
    // Query groups by moduleCode
    const groupsSnapshot = await admin
      .database()
      .ref('groups')
      .orderByChild('moduleCode')
      .equalTo(moduleCode)
      .once('value');
    
    const groups = [];
    groupsSnapshot.forEach(child => {
      groups.push({
        id: child.key,
        ...child.val()
      });
    });
    
    return { groups };
  } catch (error) {
    console.error('Error fetching module study groups:', error);
    throw new functions.https.HttpsError('internal', 'Error fetching study groups');
  }
});
