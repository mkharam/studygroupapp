// This is a utility file to help debug route issues
import React from 'react';
import { Link } from 'react-router-dom';

export function debugRoutes() {
  console.log('Fixing navigation and route issues');
  
  // Log location
  console.log('Current pathname:', window.location.pathname);
  console.log('Current search:', window.location.search);
  
  return (
    <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
      <h3 className="font-bold text-lg">Navigation Debug Info</h3>
      <p>Current path: {window.location.pathname}</p>
      <p>Current search: {window.location.search}</p>
      <div className="mt-4">
        <p className="font-bold">Try these links:</p>
        <ul className="list-disc ml-5">
          <li><Link to="/dashboard" className="text-blue-600 underline">Dashboard</Link></li>
          <li><Link to="/" className="text-blue-600 underline">Home</Link></li>
          <li><Link to="/my-modules" className="text-blue-600 underline">My Modules</Link></li>
        </ul>
      </div>
    </div>
  );
}
