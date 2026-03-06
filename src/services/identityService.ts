import prisma from '../db/prisma.js';
import { Precedence, Contact } from '@prisma/client';

export interface IdentityResponse {
    contact: {
        primaryContactId: number;
        emails: string[];
        phoneNumbers: string[];
        secondaryContactIds: number[];
    };
}

export class IdentityService {
    /**
     * Reconciles identities based on email and phoneNumber.
     * 
     * @param email - Incoming email from request
     * @param phoneNumber - Incoming phoneNumber from request
     */
    async identify(email?: string, phoneNumber?: string): Promise<IdentityResponse> {
        // 1. Search for existing contacts matching email or phoneNumber
        const matchingContacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { email: email || undefined },
                    { phoneNumber: phoneNumber || undefined }
                ]
            }
        });

        // 2. If no contacts exist, create a new PRIMARY contact
        if (matchingContacts.length === 0) {
            const newContact = await prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkPrecedence: 'primary',
                }
            });

            return {
                contact: {
                    primaryContactId: newContact.id,
                    emails: newContact.email ? [newContact.email] : [],
                    phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
                    secondaryContactIds: []
                }
            };
        }

        // 3. Find recursion/cluster: Collect all related contacts
        // First, find all primary IDs associated with matching contacts
        const primaryIds = new Set<number>();
        matchingContacts.forEach((c: Contact) => {
            primaryIds.add(c.linkedId || c.id);
        });

        // Fetch all contacts belonging to these primary groups
        const allLinkedContacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { id: { in: Array.from(primaryIds) } },
                    { linkedId: { in: Array.from(primaryIds) } }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        // Determine the true primary (the oldest contact in the cluster)
        const primaryContact = allLinkedContacts[0]!; // Since ordered by createdAt asc

        // Check for other primary contacts in the cluster that need to be demoted
        const otherPrimaries = allLinkedContacts.filter((c: Contact) => c.linkPrecedence === 'primary' && c.id !== primaryContact.id);

        // 4. Handle merging if multiple primary contacts exist
        if (otherPrimaries.length > 0) {
            for (const p of otherPrimaries) {
                await prisma.contact.updateMany({
                    where: {
                        OR: [
                            { id: p.id },
                            { linkedId: p.id }
                        ]
                    },
                    data: {
                        linkedId: primaryContact.id,
                        linkPrecedence: 'secondary'
                    }
                });

                // Update local state for response consistency
                allLinkedContacts.forEach((c: Contact) => {
                    if (c.id === p.id || c.linkedId === p.id) {
                        c.linkPrecedence = 'secondary';
                        c.linkedId = primaryContact.id;
                    }
                });
            }
        }

        // 5. Check if we need to create a new secondary contact
        const hasNewEmail = email && !allLinkedContacts.some((c: Contact) => c.email === email);
        const hasNewPhone = phoneNumber && !allLinkedContacts.some((c: Contact) => c.phoneNumber === phoneNumber);

        if (hasNewEmail || hasNewPhone) {
            const newSecondary = await prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkedId: primaryContact.id,
                    linkPrecedence: 'secondary'
                }
            });
            allLinkedContacts.push(newSecondary);
        }

        // 6. Format and return consolidated identity
        // Extract unique emails, prioritizing primary contact's email
        const emails = Array.from(new Set(
            [primaryContact.email, ...allLinkedContacts.map((c: Contact) => c.email)]
        )).filter((e): e is string => !!e);

        // Extract unique phone numbers, prioritizing primary contact's phone
        const phoneNumbers = Array.from(new Set(
            [primaryContact.phoneNumber, ...allLinkedContacts.map((c: Contact) => c.phoneNumber)]
        )).filter((p): p is string => !!p);

        const secondaryContactIds = allLinkedContacts
            .filter((c: Contact) => c.linkPrecedence === 'secondary')
            .map((c: Contact) => c.id);

        return {
            contact: {
                primaryContactId: primaryContact.id,
                emails,
                phoneNumbers,
                secondaryContactIds
            }
        };
    }
}
