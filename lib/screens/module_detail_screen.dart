import 'package:flutter/material.dart';

class ModuleDetailScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final module = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    return Scaffold(
      appBar: AppBar(title: Text(module['title'])),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Code: ${module['code']}', style: TextStyle(fontSize: 18)),
            SizedBox(height: 8),
            Text('Description: ${module['description'] ?? 'No description available.'}'),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {},
              child: Text('Join/Create Group'),
            ),
          ],
        ),
      ),
    );
  }
}