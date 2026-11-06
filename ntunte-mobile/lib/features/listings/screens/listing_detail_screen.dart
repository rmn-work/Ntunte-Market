import 'package:flutter/material.dart';
import 'package:ntunte_mobile/features/listings/widgets/carbon_impact_card.dart'; // Importe le widget que l'on vient de créer

class ListingDetailScreen extends StatelessWidget {
  final String listingTitle;
  final double price;
  final String listingCategory;
  final String listingDescription;

  const ListingDetailScreen({
    Key? key,
    required this.listingTitle,
    required this.price,
    required this.listingCategory,
    required this.listingDescription,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(listingTitle),
        backgroundColor: Colors.green,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column( // <--- C'est ici qu'il faut placer le bloc de code !
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              listingTitle,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '$price BIF',
              style: const TextStyle(fontSize: 18, color: Colors.green, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),

            // --- AJOUT DU BADGE D'IMPACT CARBONE DYNAMIQUE ---
            CarbonImpactCard(
              category: listingCategory, // ex: 'electronics', 'clothing', etc.
            ),
            // ------------------------------------------------

            const SizedBox(height: 16),
            const Text(
              "Description de l'article",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              listingDescription,
              style: const TextStyle(fontSize: 15, color: Colors.black87),
            ),
          ],
        ),
      ),
    );
  }
}