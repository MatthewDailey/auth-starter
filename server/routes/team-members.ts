import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, TeamRole } from '../../generated/prisma';
import { requiresAuth } from 'express-openid-connect';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

const updateTeamMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

// Middleware to check if user is at least an admin
async function requiresOrgAdmin(req: Request, res: Response, next: any) {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        organizationId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!teamMember) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all team members for an organization
router.get('/organizations/:organizationId/members', requiresAuth(), async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user?.id;

    // Check if user is a member of the organization
    const isMember = await prisma.teamMember.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' },
      ],
    });

    res.json({ teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Invite a new team member (creates placeholder if SAML is enabled)
router.post('/organizations/:organizationId/members', requiresAuth(), requiresOrgAdmin, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validation = inviteTeamMemberSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { email, role } = validation.data;

    // Check if organization has SAML enabled
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Check if already a team member
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a team member' });
      }

      // Add existing user to team
      const teamMember = await prisma.teamMember.create({
        data: {
          userId: user.id,
          organizationId,
          role: role as TeamRole,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              picture: true,
            },
          },
        },
      });

      return res.status(201).json({ teamMember });
    }

    // If SAML is enabled, return invitation details
    if (organization.samlEnabled) {
      return res.json({
        message: 'SAML authentication required',
        samlLoginUrl: `/api/saml/login/${organizationId}`,
        email,
        role,
      });
    }

    // For non-SAML organizations, we would typically send an invitation email
    // For now, just return an error
    res.status(400).json({ 
      error: 'User not found. Please ask them to sign up first.',
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// Update team member role
router.patch('/organizations/:organizationId/members/:memberId', requiresAuth(), requiresOrgAdmin, async (req: Request, res: Response) => {
  try {
    const { organizationId, memberId } = req.params;
    const validation = updateTeamMemberSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { role } = validation.data;

    // Check if member exists and is not the owner
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    if (teamMember.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: role as TeamRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
          },
        },
      },
    });

    res.json({ teamMember: updatedMember });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// Remove team member
router.delete('/organizations/:organizationId/members/:memberId', requiresAuth(), requiresOrgAdmin, async (req: Request, res: Response) => {
  try {
    const { organizationId, memberId } = req.params;

    // Check if member exists and is not the owner
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    if (teamMember.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot remove organization owner' });
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

export default router;