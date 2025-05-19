import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

function Terms() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-ios-gray6'}`}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className={`ios-card p-8 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className="text-ios-large-title font-bold mb-8">Terms of Service</h1>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              These Terms of Service ("Terms") govern your use of the StudyGroupApp mobile and web application ("the Service") operated by the StudyGroupApp team at the University of Surrey.
            </p>
            <p className="mb-4">
              By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.
            </p>
            <p>
              Please read these Terms carefully before using the Service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">2. Registration and Account</h2>
            <p className="mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Register for an account with your university email address</li>
              <li>Maintain the security of your account and password</li>
              <li>Promptly notify us if you discover or suspect any security breaches</li>
            </ul>
            <p className="mb-4">
              You are responsible for all activities that occur under your account. You agree to provide accurate, current, and complete information during the registration process. You must not create accounts with false or misleading information.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">3. User Conduct and Content</h2>
            <p className="mb-4">
              By using the Service, you agree not to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Post content that is defamatory, obscene, or otherwise offensive</li>
              <li>Harass, abuse, or harm another person</li>
              <li>Impersonate or misrepresent your affiliation with any person or entity</li>
              <li>Interfere with or disrupt the Service or servers/networks connected to the Service</li>
              <li>Use the Service to send spam or unsolicited messages</li>
              <li>Attempt to decipher, decompile, disassemble, or reverse engineer any of the software comprising the Service</li>
              <li>Share academic content in violation of copyright or intellectual property laws</li>
              <li>Use the Service to cheat or enable academic dishonesty</li>
            </ul>
            <p className="mb-4">
              You retain all rights to the content you post on the Service. By posting content, you grant us a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to use, store, display, reproduce, modify, and distribute your content in connection with the operation of the Service.
            </p>
            <p>
              We reserve the right to remove any content or terminate your account for violations of these Terms.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">4. Privacy and Data Use</h2>
            <p className="mb-4">
              Our collection and use of personal information in connection with the Service is described in our <Link to="/privacy-policy" className="text-ios-blue">Privacy Policy</Link>.
            </p>
            <p className="mb-4">
              By using the Service, you consent to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>The collection and use of your information as described in the Privacy Policy</li>
              <li>The processing and storage of your data on servers located in the European Economic Area</li>
              <li>The use of anonymized data for research purposes as described in our <Link to="/privacy-notice" className="text-ios-blue">Privacy Notice</Link></li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">5. Study Groups and Interactions</h2>
            <p className="mb-4">
              The Service allows users to create and join study groups. When using these features, you agree to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Respect the privacy and boundaries of other users</li>
              <li>Accurately represent the purpose and nature of study groups you create</li>
              <li>Not use study groups for activities unrelated to academic collaboration</li>
              <li>Follow any additional guidelines provided for specific groups or events</li>
            </ul>
            <p>
              We are not responsible for resolving disputes between users, but we reserve the right to intervene if users violate these Terms.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by the StudyGroupApp team and the University of Surrey and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              You may not copy, modify, create derivative works from, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Service, except for your personal, non-commercial use.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">7. Third-Party Links and Services</h2>
            <p className="mb-4">
              The Service may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
            </p>
            <p>
              You acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">8. Research Participation</h2>
            <p className="mb-4">
              StudyGroupApp is part of a research project at the University of Surrey. By using the Service, you agree that anonymized data about your usage may be used for research purposes as described in our <Link to="/privacy-notice" className="text-ios-blue">Privacy Notice</Link>.
            </p>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Withdraw from the research component at any time</li>
              <li>Request information about how your data is being used for research</li>
              <li>Access the published results of the research</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="mb-4">
              The Service is provided on an "as is" and "as available" basis. We make no warranties or representations about the accuracy or completeness of the Service's content or the content of any websites linked to the Service.
            </p>
            <p>
              We assume no liability or responsibility for any errors, mistakes, or inaccuracies of content; personal injury or property damage resulting from your access to and use of the Service; any unauthorized access to or use of our servers and/or any personal information stored therein.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by applicable law, the StudyGroupApp team and the University of Surrey will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">11. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
            </p>
          </section>
          
          <section>
            <h2 className="text-ios-title font-semibold mb-4">12. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>Mohamed Mkharam</p>
            <p>Email: <a href="mailto:mm03317@surrey.ac.uk" className="text-ios-blue">mm03317@surrey.ac.uk</a></p>
            <p>University of Surrey</p>
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

export default Terms;