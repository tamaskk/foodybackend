import { ApifyClient } from 'apify-client';

export class ApifyService {
  public client: ApifyClient;

  constructor() {
    const apifyToken = process.env.APIFY_TOKEN || '';
    this.client = new ApifyClient({
      token: apifyToken || undefined,
    });
  }
}

