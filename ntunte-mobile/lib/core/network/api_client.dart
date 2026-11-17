import 'package:dio/dio.dart';

class ApiClient {
  late final Dio dio;

  // URL de production sur Render
  static const String baseUrl = "https://ntunte-backend.onrender.com";

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          print("Erreur API [${e.response?.statusCode}] : ${e.message}");
          return handler.next(e);
        },
      ),
    );
  }

  // Récupérer l'historique des enchères d'un produit
  Future<List<dynamic>> getListingBids(int listingId) async {
    final response = await dio.get('/api/listings/$listingId/bids');
    if (response.data != null && response.data['bids'] != null) {
      return List<dynamic>.from(response.data['bids']);
    }
    return [];
  }
}