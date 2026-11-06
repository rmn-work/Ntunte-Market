import 'package:flutter/material.dart';
import 'package:ntunte_mobile/core/network/api_client.dart'; // Importe ton client API

class KycGateScreen extends StatefulWidget { // Changé en StatefulWidget pour gérer l'état de chargement
  final String kycStatus;
  final Map<String, dynamic> userProfile;

  const KycGateScreen({
    Key? key,
    required this.kycStatus,
    required this.userProfile,
  }) : super(key: key);

  @override
  State<KycGateScreen> createState() => _KycGateScreenState();
}

class _KycGateScreenState extends State<KycGateScreen> {
  bool _isLoading = false;

  // Méthode pour vérifier si le statut a changé sur le serveur
  Future<void> _checkKycStatus() async {
    setState(() { _isLoading = true; });
    try {
      final apiClient = ApiClient();
      // Appel vers ton API pour récupérer le profil mis à jour
      final response = await apiClient.dio.get('/api/users/profile'); // Ajuste la route selon ton backend

      final String latestStatus = response.data['kyc_status'];

      if (latestStatus == 'VERIFIED') {
        // Si validé, on redirige vers l'accueil ou on pop l'écran
        Navigator.of(context).pushReplacementNamed('/home'); // Remplace par ta route principale
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Votre compte est toujours en cours de vérification.')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur de connexion : $e')),
      );
    } finally {
      setState(() { _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isPending = widget.kycStatus == 'PENDING_VERIFICATION';

    return Scaffold(
      appBar: AppBar(
        title: const Text("Ntunte - Vérification d'Identité"),
        automaticallyImplyLeading: false,
        backgroundColor: Colors.teal,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isPending ? Icons.verified_user_outlined : Icons.gpp_bad,
              size: 90,
              color: isPending ? Colors.amber[800] : Colors.red,
            ),
            const SizedBox(height: 24),
            Text(
              isPending
                  ? "Compte en cours de vérification"
                  : "Vérification Rejetée",
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              isPending
                  ? "Votre pièce d'identité et vos informations sont en cours d'analyse par l'équipe Ntunte. Par mesure de sécurité anti-fraude, la consultation des annonces et les enchères restent bloquées jusqu'à validation."
                  : "Votre document d'identité n'a pas pu être validé. Veuillez réimporter une photo nette de votre carte d'identité ou passeport.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, color: Colors.grey[700]),
            ),
            const SizedBox(height: 30),
            Card(
              elevation: 2,
              child: ListTile(
                leading: const Icon(Icons.person),
                title: Text(widget.userProfile['full_name'] ?? 'Utilisateur'),
                subtitle: Text("Tél : ${widget.userProfile['phone_number'] ?? ''}"),
                trailing: Chip(
                  label: Text(
                    widget.kycStatus,
                    style: const TextStyle(color: Colors.white, fontSize: 11),
                  ),
                  backgroundColor: isPending ? Colors.amber[800] : Colors.red,
                ),
              ),
            ),
            const SizedBox(height: 30),

            // Bouton pour actualiser et vérifier si l'admin a validé le compte
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _checkKycStatus,
              icon: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.refresh),
              label: Text(_isLoading ? "Vérification en cours..." : "Vérifier si mon compte est validé"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                minimumSize: const Size.fromHeight(50),
              ),
            ),

            const SizedBox(height: 12),

            if (!isPending)
              OutlinedButton.icon(
                onPressed: () {
                  // Rediriger vers l'écran d'importation de la pièce d'ID
                },
                icon: const Icon(Icons.upload_file),
                label: const Text("Soumettre à nouveau mon ID"),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                ),
              ),
          ],
        ),
      ),
    );
  }
}