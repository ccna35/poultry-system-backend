import { Request, Response } from 'express';

import { FeedService } from '../services/FeedService';

export class FeedController {
    constructor(private readonly feedService: FeedService) { }

    addFeedPurchase = async (req: Request, res: Response): Promise<void> => {
        const feedPurchase = await this.feedService.addFeedPurchase({
            ...req.body,
            cycleId: req.params.cycleId,
        });

        res.status(201).json({ success: true, data: feedPurchase });
    };

    listByCycle = async (req: Request, res: Response): Promise<void> => {
        const purchases = await this.feedService.listFeedPurchasesByCycle(
            req.params.cycleId,
        );

        res.status(200).json({ success: true, data: purchases });
    };
}