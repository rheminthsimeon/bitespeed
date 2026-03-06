import { Request, Response } from 'express';
import { IdentityService } from '../services/identityService';

const identityService = new IdentityService();

export const identifyHandler = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return res.status(400).json({ error: 'Either email or phoneNumber must be provided.' });
        }

        const result = await identityService.identify(
            email ? String(email) : undefined,
            phoneNumber ? String(phoneNumber) : undefined
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in identity reconciliation:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
