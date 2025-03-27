# AttendanceMark

A modern, intuitive attendance management system designed for educational institutions.

## Overview

AttendanceMark simplifies the daily task of taking attendance for teachers and educational staff. With an intuitive interface, the platform makes it easy to track student attendance, generate reports, and maintain accurate records.

## Key Features

- **Real-time Attendance Tracking**: Mark students as present, absent, or late with just a few clicks
- **Bulk Operations**: Mark multiple students or entire classes at once
- **Detailed Analytics**: View attendance trends, identify patterns, and generate insightful reports
- **Automated Reminders**: Notifications for incomplete attendance records
- **Student Management**: Easily add and organize students by class and grade

## Technology Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Firebase (Authentication, Firestore Database, Cloud Functions)
- **State Management**: React Context API with custom hooks
- **Styling**: Modern CSS with responsive design

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/chama-x/ATTENDANCE.git
   cd ATTENDANCE
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your API keys:

   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. Start the development server:

   ```bash
   npm start
   # or
   yarn start
   ```

## Usage

### Attendance Management

The system provides an intuitive interface for:

- Adding new students to classes
- Marking attendance as present, absent, or late
- Viewing attendance records by date
- Generating statistics and reports
- Managing student information

## Project Structure

```
attendancemark/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── teacher/
│   │   └── admin/
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── types/
│   ├── utils/
│   │   └── firebaseService.ts
│   ├── pages/
│   ├── App.tsx
│   └── index.tsx
├── .env
├── tsconfig.json
├── package.json
└── README.md
```

## Code Architecture

The application follows a modular architecture with:

- **Component-Based Structure**: Reusable UI components organized by function
- **Custom Hooks**: For shared logic and state management
- **Context API**: For global state such as authentication
- **Type Safety**: TypeScript interfaces throughout the codebase
- **Service Abstraction**: Firebase interactions isolated in service modules

## Future Enhancements

- Mobile application for on-the-go attendance marking
- Integration with school management systems
- Advanced reporting and export options
- Multi-language support
- Offline functionality with sync capabilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for robust backend services
- All contributors who have helped shape this project

---

Developed with ❤️ by [Chamath Thiwanka](https://github.com/chama-x)
