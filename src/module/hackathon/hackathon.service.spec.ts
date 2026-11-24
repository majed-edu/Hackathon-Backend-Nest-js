import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { HackathonService } from './hackathon.service.js';
import { HackathonStatusFilter } from './dto/hackathon-query.dto.js';

describe('HackathonService', () => {
  let service: HackathonService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: vi.fn(),
      hackathon: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      hackathonParticipant: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<HackathonService>(HackathonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns only joined hackathons for the current user', async () => {
    const startDate = new Date(Date.now() + 86400000);
    const endDate = new Date(Date.now() + 172800000);
    prisma.hackathonParticipant.findMany.mockResolvedValue([
      {
        hackathon: {
          id: 'h1',
          startDate,
          endDate,
          _count: { participants: 3 },
        },
      },
    ]);

    const result = await service.findMyHackathons('user-1');

    expect(prisma.hackathonParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'h1',
        status: 'upcoming',
        participantsCount: 3,
      }),
    );
  });

  it('applies search, active, status, and pagination filters', async () => {
    prisma.$transaction.mockResolvedValue([
      [
        {
          id: 'h1',
          name: 'NestJS',
          startDate: new Date(Date.now() - 1000),
          endDate: new Date(Date.now() + 86400000),
          _count: { participants: 2 },
        },
      ],
      1,
    ]);

    const result = await service.findAll({
      search: 'nest',
      isActive: true,
      status: HackathonStatusFilter.ONGOING,
      page: 2,
      limit: 5,
    });

    expect(prisma.hackathon.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: 'nest', mode: 'insensitive' },
          isActive: true,
          AND: expect.any(Array),
        }),
        skip: 5,
        take: 5,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        currentPage: 2,
        limit: 5,
        totalItems: 1,
        totalPages: 1,
        records: [expect.objectContaining({ participantsCount: 2, status: 'ongoing' })],
      }),
    );
  });

  it('throws 404 when leave targets a missing hackathon', async () => {
    prisma.hackathon.findUnique.mockResolvedValue(null);

    await expect(service.leave('missing', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws 400 when leaving a hackathon not joined', async () => {
    prisma.hackathon.findUnique.mockResolvedValue({ id: 'h1' });
    prisma.hackathonParticipant.findUnique.mockResolvedValue(null);

    await expect(service.leave('h1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deletes only the current user participation when leaving', async () => {
    prisma.hackathon.findUnique.mockResolvedValue({ id: 'h1' });
    prisma.hackathonParticipant.findUnique.mockResolvedValue({
      id: 'p1',
      hackathonId: 'h1',
      userId: 'user-1',
    });
    prisma.hackathonParticipant.delete.mockResolvedValue({ id: 'p1' });

    await service.leave('h1', 'user-1');

    expect(prisma.hackathonParticipant.delete).toHaveBeenCalledWith({
      where: { id: 'p1' },
    });
  });
});
