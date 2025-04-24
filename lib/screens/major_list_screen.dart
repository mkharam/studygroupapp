import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class MajorListScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Majors')),
      body: StreamBuilder(
        stream: FirebaseFirestore.instance.collection('majors').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }
          final majors = snapshot.data!.docs;
          return ListView.builder(
            itemCount: majors.length,
            itemBuilder: (context, index) {
              final major = majors[index];
              return Card(
                child: ListTile(
                  title: Text(major['name']),
                  onTap: () => Navigator.pushNamed(
                    context,
                    '/modules',
                    arguments: major['name'],
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