import React from 'react';
import { FaUsers, FaBook, FaMapMarkerAlt, FaRocket } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/register');
  };
  
  const handleSignIn = () => {
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 text-white font-sans">
      <header className="text-center py-16">
        <h1 className="text-5xl font-extrabold animate-fade-in">Find Your Study Group at Surrey</h1>
        <p className="mt-6 text-xl animate-slide-in">Connect with fellow students, collaborate on assignments, and ace your modules together.</p>
        <div className="mt-8 flex justify-center space-x-4">
          <button 
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-200 transition transform hover:scale-105">
            Get Started
          </button>
          <button 
            onClick={handleSignIn}
            className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-900 transition transform hover:scale-105">
            Sign In
          </button>
        </div>
      </header>

      <main className="px-6 py-10">
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-6 flex items-center justify-center space-x-2">
            <FaUsers className="text-4xl" />
            <span>Find Your Group</span>
          </h2>
          <p className="text-lg">Browse existing study groups for your modules or create your own. Connect with students who share your academic interests.</p>
        </section>

        <section className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-6 flex items-center justify-center space-x-2">
            <FaBook className="text-4xl" />
            <span>Collaborative Learning</span>
          </h2>
          <p className="text-lg">Share notes, discuss coursework, and solve problems together. Study smarter, not harder with group collaboration.</p>
        </section>

        <section className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-6 flex items-center justify-center space-x-2">
            <FaMapMarkerAlt className="text-4xl" />
            <span>Find Study Spots</span>
          </h2>
          <p className="text-lg">Discover the best places to meet and study on campus. Use our interactive map to plan your next study session.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white text-blue-600 p-6 rounded-lg shadow-lg transform hover:scale-105 transition">
              <h3 className="text-xl font-bold mb-4">1. Create Account</h3>
              <p>Sign up with your university email to get started.</p>
            </div>
            <div className="bg-white text-blue-600 p-6 rounded-lg shadow-lg transform hover:scale-105 transition">
              <h3 className="text-xl font-bold mb-4">2. Select Modules</h3>
              <p>Add the modules you're currently studying.</p>
            </div>
            <div className="bg-white text-blue-600 p-6 rounded-lg shadow-lg transform hover:scale-105 transition">
              <h3 className="text-xl font-bold mb-4">3. Find or Create Groups</h3>
              <p>Join existing groups or start your own.</p>
            </div>
            <div className="bg-white text-blue-600 p-6 rounded-lg shadow-lg transform hover:scale-105 transition">
              <h3 className="text-xl font-bold mb-4">4. Start Collaborating</h3>
              <p>Meet up, chat, and study together.</p>
            </div>
          </div>
        </section>        <section className="text-center py-12 bg-blue-800 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center space-x-2">
            <FaRocket className="text-4xl" />
            <span>Ready to boost your academic success?</span>
          </h2>
          <p className="text-lg mb-6">Join our community of students today and experience the power of collaborative learning.</p>
          <button 
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-10 py-4 rounded-lg font-semibold shadow-lg hover:bg-gray-200 transition transform hover:scale-105">
            Sign Up Now
          </button>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
