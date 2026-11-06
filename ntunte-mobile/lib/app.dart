import 'package:flutter/material.dart';
import 'package:ntunte_mobile/core/network/api_client.dart';
// Importe tes écrans KYC que nous venons de voir
import 'package:ntunte_mobile/features/kyc/screens/kyc_gate_screen.dart';
// Importe ton écran d'accueil principal (à adapter selon ton arborescence)
// import 'package:ntunte_mobile/features/home/screens/home_screen.dart';

class NtunteApp extends StatelessWidget {
  const NtunteApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ntunte Market',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      home: const AuthGateScreen(), // Point de départ intelligent
    );
  }
}

/// Écran de contrôle qui vérifie l'état du profil et du KYC avant d'afficher l'app
class AuthGateScreen extends StatefulWidget {
  const AuthGateScreen({Key? key}) : super(key: key);

  @override
  State<AuthGateScreen> createState() => _AuthGateScreenState();
}

class _AuthGateScreenState extends State<AuthGateScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _userProfile;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchUserProfile();
  }

  Future<void> _fetchUserProfile() async {
    try {
      final apiClient = ApiClient();
      // Appel à ton API backend (assure-toi d'avoir une route '/api/users/profile' sécurisée par token)
      final response = await apiClient.dio.get('/api/users/profile');

      setState(() {
        _userProfile = response.data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = "Impossible de récupérer le profil : $e";
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // 1. Pendant le chargement de l'API
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Colors.green),
        ),
      );
    }

    // 2. En cas d'erreur réseau ou utilisateur non authentifié
    if (_userProfile == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 60, color: Colors.red),
                const SizedBox(height: 16),
                Text(_errorMessage, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    setState(() { _isLoading = true; });
                    _fetchUserProfile();
                  },
                  child: const Text("Réessayer"),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // 3. Vérification du statut KYC récupéré depuis le backend
    final String kycStatus = _userProfile!['kyc_status'] ?? 'PENDING_VERIFICATION';

    if (kycStatus != 'VERIFIED') {
      // Si le KYC n'est pas validé, on bloque l'accès et on affiche le sas de sécurité
      return KycGateScreen(
        kycStatus: kycStatus,
        userProfile: _userProfile!,
      );
    }

    // 4. Si le KYC est validé, l'utilisateur accède enfin à l'application principale (Ex: HomeScreen)
    return const Scaffold(
      body: Center(
        child: Text(
          "Bienvenue sur Ntunte ! Accès autorisé aux enchères et ventes.",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}