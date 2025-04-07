# Secure Messenger

A secure messaging application built with React and Firebase that allows users to communicate securely.

## Features

- Google Authentication
- Real-time messaging
- User presence detection
- Secure communications

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.x or later)
- npm (v6.x or later) or [Yarn](https://yarnpkg.com/)
- Git

## Installation

1. Clone this repository:

   ```
   git clone <repository-url>
   cd secure-messenger
   ```

2. Install dependencies:

   ```
   npm install
   # or with yarn
   yarn install
   ```

3. Create a `.env` file in the project root with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

## Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app to your project
4. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google sign-in provider
5. Set up Firestore Database:
   - Go to Firestore Database
   - Create a database
   - Start in production mode or test mode as needed

## Running the Application

To start the development server:

```
npm start
# or with yarn
yarn start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

To create a production build:

```
npm run build
# or with yarn
yarn build
```

## Project Structure

```
secure-messenger/
├── public/              # Static files
├── src/                 # Source code
│   ├── components/      # React components
│   ├── contexts/        # Context providers
│   ├── firebase/        # Firebase configuration
│   ├── pages/           # Application pages
│   ├── App.tsx          # Main application component
│   └── index.tsx        # Application entry point
├── .env                 # Environment variables
├── .gitignore           # Git ignore file
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Technologies Used

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Firebase](https://firebase.google.com/)
  - Authentication
  - Firestore Database
- [React Router](https://reactrouter.com/)

## Security Notes

- Never commit your `.env` file to version control
- Consider using Firebase Security Rules to secure your data
- Implement proper error handling and input validation

## License

This project is licensed under the MIT License - see the LICENSE file for details.
