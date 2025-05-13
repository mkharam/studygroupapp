import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

function PrivacyNotice() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-ios-gray6'}`}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className={`ios-card p-8 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className="text-ios-large-title font-bold mb-8">StudyGroupApp Research Privacy Notice</h1>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">Introduction</h2>
            <p className="mb-4">
              This privacy notice is specific to the research component of the StudyGroupApp platform. The University of Surrey is the sponsor for this study, and your personal data will be processed in accordance with UK data protection legislation.
            </p>
            <p>
              StudyGroupApp is being developed as part of an academic research project at the University of Surrey to study student collaboration patterns, study habits, and the effectiveness of location-based study group formation.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">What information will we collect about you?</h2>
            <p className="mb-4">
              For the research component of this project, we will collect and use:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Anonymized usage data (time spent on the application, features used)</li>
              <li>Study group interactions (frequency, duration, subjects)</li>
              <li>Module selection patterns</li>
              <li>Location data (when shared) to analyze study spot preferences</li>
              <li>Survey responses and feedback (if you choose to participate)</li>
            </ul>
            <p>
              This data will be anonymized for research analysis. No personally identifiable information will be included in the research findings or publications.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">Why we collect this information</h2>
            <p className="mb-4">
              The purpose of this research is to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Understand patterns of student collaboration in higher education</li>
              <li>Improve the design of digital tools for student collaboration</li>
              <li>Study the impact of location-based services on student study habits</li>
              <li>Develop better student engagement and support services</li>
            </ul>
            <p>
              Your participation helps advance our understanding of how technology can support student academic success.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">Legal basis for processing your data</h2>
            <p className="mb-4">
              The legal basis for processing your data for research purposes is:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Consent:</strong> You provide explicit consent to participate in the research component when you register for StudyGroupApp.</li>
              <li><strong>Public Interest:</strong> The research aims to benefit higher education practices and student success strategies.</li>
            </ul>
            <p>
              Your consent for the research component is separate from the consent to use the application generally. You can withdraw your consent for the research component at any time without affecting your ability to use the application.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">How we protect your data</h2>
            <p className="mb-4">
              We take the security and privacy of your data seriously. To protect your information, we:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Anonymize all research data to remove personally identifiable information</li>
              <li>Store research data securely on University of Surrey systems</li>
              <li>Restrict access to research data to authorized researchers only</li>
              <li>Follow University of Surrey's data protection protocols</li>
              <li>Conduct the study in accordance with ethical approval from the University's Ethics Committee</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">Who has access to your information</h2>
            <p className="mb-4">
              Access to research data is limited to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>The primary researcher (Mohamed Mkharam)</li>
              <li>Faculty supervisors overseeing the research project</li>
              <li>Members of the University of Surrey Ethics Committee (as required)</li>
            </ul>
            <p>
              All data shared with the research team will be anonymized.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">How long we keep your information</h2>
            <p className="mb-4">
              Research data will be retained in accordance with the University of Surrey's Research Data Management Policy:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Anonymized research data may be retained for up to 10 years after the completion of the research project</li>
              <li>Any personal data not anonymized will be deleted within 6 months of the completion of the research</li>
              <li>If you withdraw from the study, we will stop collecting new data but may keep anonymized data already collected</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">Research findings and publications</h2>
            <p className="mb-4">
              The findings from this research may be:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Used in academic publications</li>
              <li>Presented at academic conferences</li>
              <li>Used to improve future iterations of the StudyGroupApp</li>
              <li>Shared with the University of Surrey to inform student support strategies</li>
            </ul>
            <p>
              All published research findings will use anonymized data only.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-ios-title font-semibold mb-4">Your rights</h2>
            <p className="mb-4">
              Under data protection law, you have rights including:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Right to withdraw:</strong> You can withdraw from the research component at any time without giving a reason</li>
              <li><strong>Right to access:</strong> You can ask for a copy of your data</li>
              <li><strong>Right to erasure:</strong> You can ask for your data to be deleted (where possible)</li>
              <li><strong>Right to object:</strong> You can object to the processing of your data</li>
            </ul>
            <p>
              To exercise these rights, please contact the research team using the details below.
            </p>
          </section>
          
          <section>
            <h2 className="text-ios-title font-semibold mb-4">Contact information</h2>
            <p className="mb-4">
              For questions about this research or to exercise your data protection rights:
            </p>
            <div className="mb-4">
              <p><strong>Primary Researcher:</strong></p>
              <p>Mohamed Mkharam</p>
              <p>Email: <a href="mailto:mm03317@surrey.ac.uk" className="text-ios-blue">mm03317@surrey.ac.uk</a></p>
            </div>
            <div className="mb-4">
              <p><strong>Ethics Committee Contact:</strong></p>
              <p>University of Surrey Ethics Committee</p>
              <p>Email: <a href="mailto:ethics@surrey.ac.uk" className="text-ios-blue">ethics@surrey.ac.uk</a></p>
            </div>
            <div>
              <p><strong>University Data Protection Officer:</strong></p>
              <p>Email: <a href="mailto:dataprotection@surrey.ac.uk" className="text-ios-blue">dataprotection@surrey.ac.uk</a></p>
            </div>
            <p className="mt-4">
              If you are not content with how your data is being processed, you also have the right to complain to the Information Commissioner's Office (ICO): <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-ios-blue">https://ico.org.uk</a>
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

export default PrivacyNotice;