 import { Request, Response, NextFunction } from 'express';

// Extension de l'interface Request pour inclure l'utilisateur authentifié
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    phone_number: string;
    kycStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  };
}

export const requireVerifiedKYC = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise."
      });
    }

    // Règle stricte : Si le KYC n'est pas vérifié, on bloque l'accès aux routes métiers
    if (user.kycStatus !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        error_code: "KYC_PENDING_OR_REJECTED",
        message: "Accès restreint. Vous devez soumettre et faire valider votre pièce d'identité avant d'utiliser Ntunte.",
        current_status: user.kycStatus
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur interne du serveur middleware KYC." });
  }
};