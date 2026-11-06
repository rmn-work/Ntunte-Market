import 'package:flutter/material.dart';

class CarbonImpactCard extends StatelessWidget {
  final String category;
  final int quantity;

  const CarbonImpactCard({
    Key? key,
    required this.category,
    this.quantity = 1,
  }) : super(key: key);

  // Méthode de calcul locale (reflétant la logique du backend Node.js)
  double _calculateCarbonSavings() {
    final Map<String, double> emissionFactors = {
      'smartphone': 55.0,
      'electronics': 85.0,
      'clothing': 15.0,
      'furniture': 120.0,
      'vehicles': 2500.0,
      'default': 10.0,
    };

    final factor = emissionFactors[category.toLowerCase()] ?? emissionFactors['default']!;
    return factor * quantity;
  }

  @override
  Widget build(BuildContext context) {
    final double carbonSaved = _calculateCarbonSavings();

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        border: Border.all(color: Colors.green.shade200),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.eco,
              color: Colors.green,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Impact Écologique (IA)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Acheter cet article d''occasion évite l''émission d''environ ${carbonSaved.toStringAsFixed(1)} kg de CO₂.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}