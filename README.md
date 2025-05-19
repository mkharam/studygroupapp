# StudyGroupApp

A comprehensive platform for facilitating study group formation and management at the University of Surrey. This application helps students connect with peers, coordinate study sessions, and optimize the use of campus study spaces.

## Features

### Core Functionality
- **Study Group Management**
  - Create and join study groups for specific modules
  - Real-time group updates and notifications
  - Member management with role-based permissions
  - Study session scheduling and tracking

- **Location Services**
  - Interactive campus map integration
  - Study space availability tracking
  - Real-time location sharing
  - Space search and filtering

- **Communication Tools**
  - Real-time chat system
  - Study session coordination
  - Progress monitoring
  - Group announcements

- **User Management**
  - Secure authentication
  - Profile management
  - Module enrollment tracking
  - Academic preferences

## Technical Stack

### Frontend
- React 18
- Tailwind CSS
- React Router
- React Icons
- Jest for testing

### Backend
- Firebase Authentication
- Firebase Realtime Database
- Firebase Cloud Functions
- Firebase Cloud Storage

### APIs
- Google Maps Platform
- Calendar API

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Google Maps API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/studygroupapp.git
cd studygroupapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_DATABASE_URL=your_firebase_database_url
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Start the development server:
```bash
npm start
```

## Project Structure

```
studygroupapp/
├── src/
│   ├── components/         # React components
│   ├── context/           # React context providers
│   ├── firebase/          # Firebase configuration and utilities
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── views/             # Page components
│   └── App.js             # Main application component
├── public/                # Static files
├── functions/             # Firebase Cloud Functions
└── tests/                 # Test files
```

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```



## Legal and Ethical Considerations

### Data Protection
- GDPR compliant
- Secure data storage
- User consent management
- Data retention policies

### Accessibility
- WCAG 2.1 compliance
- Screen reader support
- Keyboard navigation
- Color contrast compliance

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- University of Surrey for support and resources
- Firebase team for excellent documentation
- React community for amazing tools and libraries



*Developed as part of the Final Year Project at the University of Surrey*
