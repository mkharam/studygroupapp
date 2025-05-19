import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

function PrivacyPolicy() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-ios-gray6'}`}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className={`ios-card p-8 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className="text-ios-large-title font-bold mb-8">Privacy Policy</h1>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              This Privacy Policy explains how StudyGroupApp collects, uses, and protects your personal information when you use our application. We are committed to ensuring that your privacy is protected in compliance with applicable data protection laws, including the General Data Protection Regulation (GDPR).
            </p>
            <p>
              By using StudyGroupApp, you consent to the data practices described in this policy. Please read this policy carefully to understand our practices regarding your personal data.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect the following types of information:</p>
            
            <h3 className="text-ios-subhead font-semibold mb-2">2.1 Personal Information</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Full name</li>
              <li>Email address</li>
              <li>Academic information (faculty, department, major, year of study)</li>
              <li>Profile information you provide (including profile pictures)</li>
            </ul>
            
            <h3 className="text-ios-subhead font-semibold mb-2">2.2 Usage Data</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Study groups you create or join</li>
              <li>Modules you add to your profile</li>
              <li>Messages sent within the application</li>
              <li>Location data (when you opt in to share your location)</li>
              <li>Device information (browser type, operating system)</li>
              <li>Log data (IP address, access times, pages viewed)</li>
            </ul>
            
            <h3 className="text-ios-subhead font-semibold mb-2">2.3 Cookies</h3>
            <p>
              We use cookies and similar tracking technologies to track activity on our application and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect for the following purposes:</p>
            
            <h3 className="text-ios-subhead font-semibold mb-2">3.1 To Provide and Maintain Our Service</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Creating and managing your account</li>
              <li>Connecting you with relevant study groups and other users</li>
              <li>Recommending modules and study spots based on your profile</li>
              <li>Enabling communication between users</li>
              <li>Personalizing your experience</li>
            </ul>
            
            <h3 className="text-ios-subhead font-semibold mb-2">3.2 For Research Purposes</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Analyzing usage patterns to improve the application</li>
              <li>Understanding student study habits and preferences (in anonymized form)</li>
              <li>Developing new features based on user feedback</li>
            </ul>
            
            <h3 className="text-ios-subhead font-semibold mb-2">3.3 For Communication</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Sending you notifications about study group activities</li>
              <li>Providing updates about the application</li>
              <li>Responding to your inquiries and support requests</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">4. Legal Basis for Processing</h2>
            <p className="mb-4">
              We process your personal data on the following legal bases:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Consent:</strong> We process your data based on your explicit consent when you register for an account and accept our Terms of Service.</li>
              <li><strong>Legitimate Interest:</strong> We process your data based on our legitimate interests in providing and improving the StudyGroupApp platform, as long as these interests are not overridden by your data protection rights.</li>
              <li><strong>Contract:</strong> We process your data as necessary to fulfill our contract with you to provide the services as described in our Terms of Service.</li>
              <li><strong>Research:</strong> With your consent, we process anonymized data for research purposes in connection with university studies on student collaboration and study habits.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">5. Data Retention</h2>
            <p className="mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. We will retain and use your data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <p className="mb-4">
              If you delete your account, we will delete your personal data within 30 days, except where:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>We are required to retain it for legal reasons</li>
              <li>The data has been anonymized for research purposes</li>
              <li>It is needed for legitimate safety or security reasons</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">6. Data Sharing</h2>
            <p className="mb-4">We may share your information with:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Other Users:</strong> When you create or join study groups, certain profile information will be visible to other group members.</li>
              <li><strong>Service Providers:</strong> We may employ third-party companies to facilitate our service, perform service-related tasks, or assist us in analyzing how our service is used.</li>
              <li><strong>University of Surrey Researchers:</strong> Anonymized data may be shared with researchers at the University of Surrey for academic purposes.</li>
              <li><strong>Legal Requirements:</strong> We may disclose personal data if required to do so by law or in good-faith belief that such action is necessary to comply with legal obligations.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">7. Your Data Protection Rights</h2>
            <p className="mb-4">
              Under GDPR, you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Right to Access:</strong> You have the right to request copies of your personal data.</li>
              <li><strong>Right to Rectification:</strong> You have the right to request that we correct any inaccurate information.</li>
              <li><strong>Right to Erasure:</strong> You have the right to request that we delete your personal data.</li>
              <li><strong>Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your data.</li>
              <li><strong>Right to Data Portability:</strong> You have the right to request that we transfer your data to another organization or directly to you.</li>
              <li><strong>Right to Object:</strong> You have the right to object to our processing of your personal data.</li>
              <li><strong>Right to Withdraw Consent:</strong> If we rely on your consent to process your personal data, you have the right to withdraw that consent at any time.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the information in the "Contact Us" section.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">8. Data Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Encryption of data transmission</li>
              <li>Regular security assessments</li>
              <li>Access control procedures</li>
              <li>Secure storage of password data</li>
            </ul>
            <p>
              However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">9. Privacy of Minors</h2>
            <p className="mb-4">
              StudyGroupApp is intended for users who are at least 18 years old. We do not knowingly collect personal data from individuals under 18 years of age. If we become aware that we have inadvertently collected personal data from a person under 18 years of age, we will delete such information from our records.
            </p>
            <p>
              If you are a parent or guardian and believe that your child has provided us with personal information, please contact us so that we can take necessary actions.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            <p>
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">11. Links to Other Websites</h2>
            <p>
              Our application may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
          </section>
          
          <section>
            <h2 className="text-ios-title font-semibold mb-4">12. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>Mohamed Mkharam</p>
            <p>Email: <a href="mailto:mm03317@surrey.ac.uk" className="text-ios-blue">mm03317@surrey.ac.uk</a></p>
            <p>University of Surrey</p>
            <p className="mt-4">
              You also have the right to make a complaint to the UK Information Commissioner's Office (ICO) if you believe your data has been processed unlawfully: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-ios-blue">https://ico.org.uk</a>
            </p>
          </section>
          
          <div className="mt-8 text-right text-sm text-ios-gray">
            Last Updated: 13 May 2025
          </div>
        </div>
        <div className="text-center">
          <Link to="/" className="text-ios-blue">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;