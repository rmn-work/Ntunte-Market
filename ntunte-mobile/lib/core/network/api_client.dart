import 'package:dio/dio.dart';

class ApiClient {
  late final Dio dio;

  // URL de production sur Render[cite: 1, 2]
  static const String baseUrl = "https://ntunte-backend.onrender.com";

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Intercepteurs pour l'authentification et la gestion globale des erreurs
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Vous pourrez injecter le token JWT ici si l'utilisateur est connecté
          // const token = "VOTRE_TOKEN_JWT";
          // if (token.isNotEmpty) {
          //   options.headers["Authorization"] = "Bearer $token";
          // }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Gestion centralisée (ex: intercepter le statut 403 pour le KYC bloqué)
          print("Erreur API [${e.response?.statusCode}] : ${e.message}");
          return handler.next(e);
        },
      ),
    );
  }
}