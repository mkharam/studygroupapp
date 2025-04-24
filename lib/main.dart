import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_config.dart';
import 'theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: firebaseOptions);
  runApp(StudyGroupApp());
}

class StudyGroupApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Surrey StudyGroupApp',
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
      initialRoute: '/',
      routes: {
        '/': (_) => AuthGate(),
        '/majors': (_) => MajorListScreen(),
        '/modules': (_) => ModuleListScreen(),
        '/moduleDetail': (_) => ModuleDetailScreen(),
        '/chat': (_) => ChatScreen(),
        '/map': (_) => MapScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}