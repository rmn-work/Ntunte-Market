import 'package:flutter/material.dart';

class KycLockScreen extends StatelessWidget {
  final String kycStatus; // 'PENDING_VERIFICATION' ou 'REJECTED'

  const KycLockScreen({Key? key, required this.kycStatus}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Ntunte - Vérification de Sécurité"),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.security, size: 80, color: Colors.orange),
            const SizedBox(height: 24),
            const Text(
              "Compte en attente de validation",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              kycStatus == 'PENDING_VERIFICATION'
                  ? "Votre pièce d'identité et votre selfie de vérification sont en cours d'examen par notre équipe. Par mesure de sécurité contre les fraudes, l'accès aux annonces et aux enchères est bloqué jusqu'à validation."
                  : "Votre vérification a été rejetée. Veuillez soumettre de nouveau des documents clairs.",
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                // Action pour voir/modifier ses détails d'inscription soumis
              },
              icon: const Icon(Icons.person),
              label: const Text("Voir mes détails d'inscription"),
            ),
          ],
        ),
      ),
    );
  }
}