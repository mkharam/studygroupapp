import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ModuleListScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final String major = ModalRoute.of(context)!.settings.arguments as String;
    return Scaffold(
      appBar: AppBar(title: Text('$major Modules')),
      body: StreamBuilder(
        stream: FirebaseFirestore.instance
            .collection('modules')
            .where('major', isEqualTo: major)
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }
          final modules = snapshot.data!.docs;
          return ListView.builder(
            itemCount: modules.length,
            itemBuilder: (context, index) {
              final module = modules[index];
              return Card(
                child: ListTile(
                  title: Text(module['title']),
                  subtitle: Text(module['code']),
                  onTap: () => Navigator.pushNamed(
                    context,
                    '/moduleDetail',
                    arguments: module,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}