import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Client } from '@microsoft/microsoft-graph-client';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { targetUserId, subject } = req.body;

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        fromId: session.user.id,
        toId: targetUserId,
        status: 'PENDING',
        subject: subject || 'Study Session'
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          }
        },
        to: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          }
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'CONNECTION_REQUEST',
        message: `${session.user.name || 'Someone'} wants to connect with you!`,
        data: JSON.stringify({
          connectionId: connection.id,
          fromUser: {
            id: connection.from.id,
            name: connection.from.name,
            email: connection.from.email,
            profilePicture: connection.from.profilePicture
          }
        })
      }
    });

    // If Teams integration is enabled and configured
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      const token = await getToken({ req });
      if (token?.accessToken) {
        const client = Client.init({
          authProvider: (done) => {
            done(null, token.accessToken);
          },
        });

        // Create Teams meeting
        const meeting = await client.api('/me/onlineMeetings').post({
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 3600000).toISOString(),
          subject: `Study Session: ${subject}`,
        });

        // Update connection with meeting link
        await prisma.connection.update({
          where: { id: connection.id },
          data: { meetingLink: meeting.joinUrl }
        });

        return res.status(200).json({ 
          message: 'Connection request sent with Teams meeting',
          meetingLink: meeting.joinUrl,
          connection: {
            id: connection.id,
            from: connection.from,
            to: connection.to,
            status: connection.status,
            subject: connection.subject,
            meetingLink: meeting.joinUrl
          }
        });
      }
    }

    return res.status(200).json({ 
      message: 'Connection request sent',
      connection: {
        id: connection.id,
        from: connection.from,
        to: connection.to,
        status: connection.status,
        subject: connection.subject
      }
    });
  } catch (error: any) {
    console.error('Connection request error:', error);
    return res.status(500).json({ 
      message: 'Error creating connection request',
      error: error.message 
    });
  }
}
