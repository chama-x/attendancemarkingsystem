# AttendanceMark

A modern, intuitive attendance management system designed for educational institutions with AI-powered assistance.

## Overview

AttendanceMark simplifies the daily task of taking attendance for teachers and educational staff. With an intuitive interface and an AI assistant, the platform makes it easy to track student attendance, generate reports, and maintain accurate records.

## Key Features

- **AI Teaching Assistant**: Natural language interface to quickly mark attendance, add students, and retrieve information
- **Real-time Attendance Tracking**: Mark students as present, absent, or late with just a few clicks
- **Bulk Operations**: Mark multiple students or entire classes at once
- **Detailed Analytics**: View attendance trends, identify patterns, and generate insightful reports
- **Automated Reminders**: Notifications for incomplete attendance records
- **Student Management**: Easily add and organize students by class and grade

## Technology Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Firebase (Authentication, Firestore Database, Cloud Functions)
- **AI Integration**: Google's Generative AI (Gemini 1.5 Flash)
- **State Management**: React Context API with custom hooks
- **Styling**: Modern CSS with responsive design

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn
- Firebase account
- Google Generative AI API key

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
   REACT_APP_GOOGLE_GENAI_API_KEY=your_google_genai_api_key
   ```

4. Start the development server:

   ```bash
   npm start
   # or
   yarn start
   ```

## Usage

### AI Assistant Commands

The AI assistant responds to natural language queries or the following slash commands:

- `/add-student [name]` - Add a new student
- `/mark-present [name]` - Mark a student as present
- `/mark-absent [name]` - Mark a student as absent
- `/mark-all [status]` - Mark all students with a status
- `/mark-students [status] [name1], [name2]` - Mark multiple specific students
- `/today` - Show today's attendance statistics
- `/present` - List students who are present today
- `/absent` - List students who are absent today
- `/late` - List students who are late today
- `/stats` - Show overall attendance statistics
- `/help` - Display available commands

### Example Interactions

Simply type natural language requests like:

- "Mark Sunil and Sampath as present"
- "Add a new student named Hasith Rajapaksa"
- "Who's absent today?"
- "Show me the attendance statistics for this month"

## Project Structure

```
attendancemark/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── teacher/
│   │   │   └── AIAssistantWidget.tsx
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

## Optimizations

The project implements several optimizations for performance and maintainability:

- **Tool Execution Abstraction**: Centralized error handling for consistent responses
- **Dynamic Command Registry**: Flexible command system for easy extension
- **Bulk Operation Optimizer**: Efficient processing of multiple attendance records
- **AI Context Composition**: Dynamic context generation for better AI responses
- **Custom Message Hooks**: Streamlined state management for chat functionality
- **Status Indicators**: Visual feedback for asynchronous operations

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

- Google for providing the Generative AI API
- Firebase for robust backend services
- All contributors who have helped shape this project

---

Developed with ❤️ by [Chamath Thiwanka](https://github.com/chama-x)
