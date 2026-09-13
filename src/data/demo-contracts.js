/**
 * Sample terms-of-service documents for the public demo.
 *
 * These are original texts written for PANDA, modelled on the clause patterns
 * catalogued in consumer-law research on online terms. The companies are
 * fictional; any resemblance to a real provider's wording is coincidental.
 */

export const DEMO_CONTRACTS = [
  {
    id: 'nimbus',
    name: 'Nimbus Drive',
    kind: 'Cloud storage',
    blurb: 'A file-sync service with the clause stack you meet most often.',
    text: `Nimbus Drive Terms of Service

1. Acceptance of these Terms
By accessing, browsing, registering for or otherwise using Nimbus Drive in any manner, you acknowledge that you have read these Terms and agree to be bound by them. If you do not agree, you must stop using the Service immediately.

2. Changes to the Service and to these Terms
We reserve the right, at our sole discretion, to modify, suspend or replace these Terms at any time. Revised Terms take effect as soon as they are posted on our website, and your continued use of the Service after that date constitutes your acceptance of the revised Terms. We are not obliged to notify you individually of any change.

3. Your content
You retain ownership of the files you upload. We may, however, review, refuse to display, remove or delete any content at our sole discretion and without prior notice, including where we believe in good faith that it violates these Terms. We have no obligation to store your content or to return any copy of it to you after removal.

4. Suspension and termination
We may suspend or terminate your account and your access to the Service at any time, with or without notice, for any reason or for no reason, at our sole discretion. Fees already paid are non-refundable in the event of termination. You may close your account at any time from your account settings.

5. Service availability
The Service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, timely, secure or error-free.

6. Limitation of liability
To the maximum extent permitted by law, Nimbus Drive, its affiliates, officers and suppliers shall not be liable for any indirect, incidental, special, punitive or consequential damages, including loss of data, loss of profits or business interruption, arising out of or in connection with your use of the Service. Our total aggregate liability to you for all claims shall not exceed the greater of the amount you paid us in the twelve months preceding the claim or twenty euros.

7. Governing law and venue
These Terms and any dispute arising out of them shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. You agree that any claim shall be brought exclusively in the state or federal courts located in Wilmington, Delaware, and you consent to the personal jurisdiction of those courts.

8. Dispute resolution
Any dispute, claim or controversy arising out of these Terms shall be resolved by final and binding arbitration administered under the rules of a recognised arbitral institution. You waive any right to a trial by jury and any right to participate in a class, collective or representative action.

9. Support
We aim to answer support requests within two business days. Security incidents affecting your data will be reported to you and to the competent supervisory authority without undue delay.`,
  },
  {
    id: 'bazaar',
    name: 'Bazaar Market',
    kind: 'Marketplace',
    blurb: 'Marketplace terms where the risk quietly shifts to the seller.',
    text: `Bazaar Market Seller Agreement

1. Scope
This Agreement governs your use of the Bazaar Market platform as a seller. By listing an item, you agree to the terms set out below.

2. Platform rules
We may amend the platform rules, the fee schedule and this Agreement at any time and at our sole discretion, effective upon publication in the seller dashboard. It is your responsibility to review the rules regularly.

3. Listings
We may edit, downrank, hide or delete any listing at any time without notice and without giving reasons, including where a listing is, in our judgement, inconsistent with the character of the platform. We do not guarantee that any listing will be visible to buyers.

4. Payouts
Payouts are released fourteen days after delivery is confirmed. We may withhold, set off or reverse a payout where we suspect a breach of this Agreement, and we may hold the disputed amount until our internal review is complete.

5. Account status
We may restrict, suspend or permanently close your seller account at any time, for any reason or no reason, at our sole discretion, and without any obligation to compensate you for lost sales or for goods already shipped.

6. Liability
In no event shall Bazaar Market be liable to you for lost profits, lost sales, loss of goodwill or any indirect or consequential loss, whether arising in contract, tort or otherwise, even if we were advised of the possibility of such loss. Our liability for any claim is limited to the total fees you paid to us in the three months preceding the claim.

7. Indemnity
You agree to indemnify and hold us harmless against any claim brought by a buyer or a third party in connection with your listings, your goods or your conduct on the platform.

8. Law and forum
This Agreement is governed by the laws of Singapore. Any dispute shall be submitted to the exclusive jurisdiction of the courts of Singapore, regardless of where you or the buyer are established.

9. Statutory rights
Nothing in this Agreement limits any right you have under mandatory consumer or commercial law in your country of establishment. You may terminate this Agreement at any time by closing your seller account and settling any outstanding fees.`,
  },
  {
    id: 'streamhaus',
    name: 'StreamHaus',
    kind: 'Streaming',
    blurb: 'A subscription service: fairer than most, but not everywhere.',
    text: `StreamHaus Subscriber Terms

1. Your subscription
Your subscription renews monthly until you cancel. You can cancel at any time in your account settings, and cancellation takes effect at the end of the current billing period. We will email you a receipt after every payment.

2. Price changes
If we change the price of your plan, we will tell you by email at least thirty days before the change takes effect. You may reject the new price by cancelling before the effective date, and no cancellation fee applies.

3. Using the Service
By creating an account or streaming any title, you agree to these Terms and to our Acceptable Use Policy.

4. Your library
Titles may be added to or removed from the catalogue as our licences change. Where a title you have downloaded leaves the catalogue, we will tell you in the app before it becomes unavailable.

5. Reviews and comments
We may remove a review or comment that breaches our community guidelines. If we do, we will tell you which guideline was breached and you may appeal the decision within thirty days.

6. Ending the agreement
We may suspend or terminate your account for a serious or repeated breach of these Terms. Except where a delay would cause harm to other subscribers, we will warn you first and give you the chance to put things right. If we terminate without cause, we refund the unused part of your current billing period.

7. Our responsibility
We are responsible for foreseeable loss and damage caused by our breach of these Terms. We are not liable for loss that was not foreseeable, nor for interruptions caused by your own internet connection or device.

8. Applicable law
These Terms are governed by the laws of the country in which you live, and you may bring proceedings in the courts of that country.

9. Contact and complaints
You can reach our support team at any time from the help centre. If we cannot resolve a complaint within fourteen days, you may refer it to an independent consumer dispute body at no cost to you.`,
  },
];

export const DEFAULT_CONTRACT_ID = DEMO_CONTRACTS[0].id;
