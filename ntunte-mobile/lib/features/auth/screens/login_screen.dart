import 'package:flutter/material.dart';
import 'package:ntunte_mobile/core/network/api_client.dart';
import 'package:ntunte_mobile/features/auth/screens/register_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
// Importe ton écran principal après connexion (ex: NearbyListingsScreen ou NtunteApp)

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.dio.post('/api/auth/login', data: {
        'identifier': _identifierController.text.trim(),
        'password': _passwordController.text.trim(),
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data;
        final prefs = await SharedPreferences.getInstance();

        await prefs.setString('token', data['token']);
        await prefs.setInt('userId', data['user']['id']);
        await prefs.setString('username', data['user']['username']);

        // Redirection vers l'accueil général et suppression de l'historique auth
        if (mounted) {
          Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Identifiants incorrects ou erreur réseau.";
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text("Connexion à Ntunte", style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              const Text("Connectez-vous pour participer aux enchères.", style: TextStyle(color: Colors.grey, fontSize: 14), textAlign: TextAlign.center),
              const SizedBox(height: 24),

              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
                  child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                ),

              TextField(
                controller: _identifierController,
                decoration: const InputDecoration(labelText: "E-mail ou Pseudo", border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: "Mot de passe", border: OutlineInputBorder()),
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, padding: const EdgeInsets.symmetric(vertical: 14)),
                child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text("Se connecter", style: TextStyle(fontSize: 16, color: Colors.white)),
              ),
              const SizedBox(height: 16),

              TextButton(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const RegisterScreen()));
                },
                child: const Text("Vous n'avez pas de compte ? S'inscrire"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}