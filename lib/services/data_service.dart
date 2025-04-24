import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class DataService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<List<dynamic>> loadMajorsModulesFromAssets() async {
    final String response = await rootBundle.loadString('assets/data/majors_modules.json');
    return json.decode(response);
  }

  Future<void> importMajorsModules() async {
    final callable = FirebaseFunctions.instance.httpsCallable('importMajorsModules');
    await callable();
  }

  Stream<List<Map<String, dynamic>>> fetchMajors() {
    return _firestore.collection('majors').snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => doc.data()).toList());
  }

  Stream<List<Map<String, dynamic>>> fetchModules(String major) {
    return _firestore.collection('modules').where('major', isEqualTo: major).snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => doc.data()).toList());
  }
}