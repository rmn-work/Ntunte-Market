import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ntunte Market',
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Ntunte Market'),
        ),
        body: const Center(
          child: Text('Bienvenue sur Ntunte Market'),
        ),
      ),
    );
  }
}