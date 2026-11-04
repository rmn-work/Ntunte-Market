import 'package:flutter/material.dart';

class KycGateScreen extends StatelessWidget {
  final String kycStatus; // 'PENDING_VERIFICATION' ou 'REJECTED'
  final Map<String, dynamic> userProfile;

  const KycGateScreen({
    Key? key,
    required this.kycStatus,
    required this.userProfile,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    bool isPending = kycStatus == 'PENDING_VERIFICATION';

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
                title: Text(userProfile['full_name'] ?? 'Utilisateur'),
                subtitle: Text("Tél : ${userProfile['phone_number'] ?? ''}"),
                trailing: Chip(
                  label: Text(
                    kycStatus,
                    style: const TextStyle(color: Colors.white, fontSize: 11),
                  ),
                  backgroundColor: isPending ? Colors.amber[800] : Colors.red,
                ),
              ),
            ),
            const SizedBox(height: 30),
            if (!isPending)
              ElevatedButton.icon(
                onPressed: () {
                  // Rediriger vers l'écran d'importation de la pièce d'ID
                },
                icon: const Icon(Icons.upload_file),
                label: const Text("Soumettre à nouveau mon ID"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  minimumSize: const Size.fromHeight(50),
                ),
              ),
          ],
        ),
      ),
    );
  }
}