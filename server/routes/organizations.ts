import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { requiresAuth } from 'express-openid-connect';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  samlEnabled: z.boolean().optional(),
  samlEntryPoint: z.string().url().optional(),
  samlIssuer: z.string().optional(),
  samlCert: z.string().optional(),
});

// Middleware to check if user is organization owner
async function requiresOrgOwner(req: Request, res: Response, next: any) {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        ownerId: userId,
      },
    });

    if (!organization) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all organizations for the current user
router.get('/', requiresAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            teamMembers: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { teamMembers: true },
        },
      },
    });

    res.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Get a specific organization
router.get('/:organizationId', requiresAuth(), async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user?.id;

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          { ownerId: userId },
          {
            teamMembers: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
          },
        },
        _count: {
          select: { teamMembers: true },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// Create a new organization
router.post('/', requiresAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const validation = createOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { name, slug } = validation.data;

    // Check if slug is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return res.status(400).json({ error: 'Organization slug already taken' });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        ownerId: userId,
        teamMembers: {
          create: {
            userId: userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        _count: {
          select: { teamMembers: true },
        },
      },
    });

    res.status(201).json({ organization });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Update organization settings
router.patch('/:organizationId', requiresAuth(), requiresOrgOwner, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validation = updateOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: validation.data,
      include: {
        _count: {
          select: { teamMembers: true },
        },
      },
    });

    res.json({ organization });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Delete organization
router.delete('/:organizationId', requiresAuth(), requiresOrgOwner, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Delete all team members first
    await prisma.teamMember.deleteMany({
      where: { organizationId },
    });

    // Delete the organization
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

export default router;