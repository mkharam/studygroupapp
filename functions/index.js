const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.importMajorsModules = functions.https.onCall(async () => {
  const json = require('../assets/data/majors_modules.json');
  const db = admin.firestore();
  for (const item of json) {
    await db.collection('majors').doc(item.major).set({ name: item.major });
    for (const mod of item.modules) {
      await db.collection('modules').add({
        code: mod.code,
        title: mod.title,
        major: item.major
      });
    }
  }
  return { success: true };
});