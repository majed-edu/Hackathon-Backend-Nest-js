import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';
import { HackathonQueryDto, HackathonStatusFilter } from './dto/hackathon-query.dto.js';

type HackathonStatus = 'upcoming' | 'ongoing' | 'completed';

function getHackathonStatus(
  startDate: Date,
  endDate: Date,
  now = new Date(),
): HackathonStatus {
  if (now.getTime() < startDate.getTime()) return 'upcoming';
  if (now.getTime() > endDate.getTime()) return 'completed';
  return 'ongoing';
}

function withStatus<T extends { startDate: Date; endDate: Date }>(hackathon: T) {
  return {
    ...hackathon,
    status: getHackathonStatus(hackathon.startDate, hackathon.endDate),
  };
}

@Injectable()
export class HackathonService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateHackathonDto, authorId: string) {
    if (dto.endsAt <= dto.startsAt) {
      throw new BadRequestException(
        'endsAt must be after startsAt',
      );
    }

    return this.prisma.hackathon.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startsAt,
        endDate: dto.endsAt,
        isActive: dto.isActive,
        maxParticipants: dto.maxParticipants,
        authorId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { participants: true } },
      },
    }).then((hackathon) => ({
      ...withStatus(hackathon),
      participantsCount: hackathon._count.participants,
    }));
  }

  async findAll(query: HackathonQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const now = new Date();
    const where: {
      name?: { contains: string; mode: 'insensitive' };
      isActive?: boolean;
      startDate?: { gt: Date };
      endDate?: { lt: Date };
      AND?: Array<
        | { startDate: { lte: Date } }
        | { endDate: { gte: Date } }
      >;
    } = {};

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.status === HackathonStatusFilter.UPCOMING) {
      where.startDate = { gt: now };
    } else if (query.status === HackathonStatusFilter.COMPLETED) {
      where.endDate = { lt: now };
    } else if (query.status === HackathonStatusFilter.ONGOING) {
      where.AND = [
        { startDate: { lte: now } },
        { endDate: { gte: now } },
      ];
    }

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.hackathon.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hackathon.count({ where }),
    ]);

    const records = items.map((hackathon) =>
      withStatus({
        ...hackathon,
        participantsCount: hackathon._count.participants,
      }),
    );

    return {
      records,
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async findOne(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        participants: true,
        _count: { select: { participants: true } },
      },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with id "${id}" not found`);
    }

    return {
      ...withStatus(hackathon),
      participantsCount: hackathon._count.participants,
    };
  }

  async findMyHackathons(userId: string) {
    const participations =
      await this.prisma.hackathonParticipant.findMany({
        where: { userId },
        include: {
          hackathon: {
            include: {
              author: {
                select: { id: true, name: true, email: true },
              },
              _count: { select: { participants: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

    return participations.map(({ hackathon }) => ({
      ...withStatus(hackathon),
      participantsCount: hackathon._count.participants,
    }));
  }

  async update(id: string, dto: UpdateHackathonDto) {
    const existing = await this.prisma.hackathon.findUnique({
      where: { id },
      select: { id: true, startDate: true, endDate: true },
    });
    if (!existing) {
      throw new NotFoundException(`Hackathon with id "${id}" not found`);
    }

    const effectiveStart = dto.startsAt ?? existing.startDate;
    const effectiveEnd = dto.endsAt ?? existing.endDate;
    if (effectiveEnd <= effectiveStart) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    try {
      return await this.prisma.hackathon.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          startDate: dto.startsAt,
          endDate: dto.endsAt,
          isActive: dto.isActive,
          maxParticipants: dto.maxParticipants,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          _count: { select: { participants: true } },
        },
      }).then((hackathon) => ({
        ...withStatus(hackathon),
        participantsCount: hackathon._count.participants,
      }));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Hackathon with id "${id}" not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.hackathon.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Hackathon with id "${id}" not found`);
    }

    try {
      return await this.prisma.hackathon.delete({ where: { id } });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Hackathon with id "${id}" not found`);
      }
      throw error;
    }
  }

  async join(hackathonId: string, userId: string) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`
            SELECT "id"
            FROM "hackathon"
            WHERE "id" = ${hackathonId}
            FOR UPDATE
          `;

          const hackathon = await tx.hackathon.findUnique({
            where: { id: hackathonId },
          });

          if (!hackathon) {
            throw new NotFoundException(
              `Hackathon with id "${hackathonId}" not found`,
            );
          }
          if (!hackathon.isActive) {
            throw new BadRequestException('Hackathon is not active');
          }
          if (hackathon.endDate <= new Date()) {
            throw new BadRequestException('Hackathon has ended');
          }

          const existingParticipant =
            await tx.hackathonParticipant.findUnique({
              where: {
                hackathonId_userId: { hackathonId, userId },
              },
            });
          if (existingParticipant) {
            throw new BadRequestException(
              'User already joined this hackathon',
            );
          }

          if (hackathon.maxParticipants !== null) {
            const participantCount =
              await tx.hackathonParticipant.count({
                where: { hackathonId },
              });
            if (participantCount >= hackathon.maxParticipants) {
              throw new BadRequestException(
                'Hackathon has reached maximum participant capacity',
              );
            }
          }

          return tx.hackathonParticipant.create({
            data: { hackathonId, userId },
          });
        },
        {
          isolationLevel: 'Serializable',
          maxWait: 10000,
          timeout: 30000,
        },
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2028'
      ) {
        throw new BadRequestException(
          'Join request conflicted with another request; please retry',
        );
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2034'
      ) {
        throw new BadRequestException(
          'Join request conflicted with another request; please retry',
        );
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('User already joined this hackathon');
      }
      throw error;
    }
  }

  async leave(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true },
    });
    if (!hackathon) {
      throw new NotFoundException(
        `Hackathon with id "${hackathonId}" not found`,
      );
    }

    const participation =
      await this.prisma.hackathonParticipant.findUnique({
        where: {
          hackathonId_userId: { hackathonId, userId },
        },
      });
    if (!participation) {
      throw new BadRequestException(
        'User has not joined this hackathon',
      );
    }

    try {
      await this.prisma.hackathonParticipant.delete({
        where: { id: participation.id },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException(
          'User has not joined this hackathon',
        );
      }
      throw error;
    }

    return participation;
  }
}
