import 'package:flutter/material.dart';
import 'package:ntunte_mobile/features/listings/screens/nearby_listings_screen.dart';

void main() {
  runApp(const NtunteApp());
}

class NtunteApp extends StatelessWidget {
  const NtunteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ntunte Market',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 0.5,
        ),
      ),
      home: const NearbyListingsScreen(),
    );
  }
}