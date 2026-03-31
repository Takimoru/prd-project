/**
 * Admin-Specific Resolver
 * Per PRD: Admin Migration - Additional Admin-only functions
 */

import { Resolver, Query, Mutation, Arg, ID, Ctx, ObjectType, Field } from 'type-graphql';
import { Context } from '../context';
import { requireAdminRole } from '../../lib/auth-helpers';
import { AppDataSource } from '../../data-source';
import { Team } from '../../entities/Team';
import { Attendance } from '../../entities/Attendance';
import { WeeklyAttendanceApproval } from '../../entities/WeeklyAttendanceApproval';
import { User } from '../../entities/User';
import * as PostHog from '../../lib/posthog';
import { join } from 'path';
import { In } from 'typeorm';

/**
 * CSV Export Resolver
 * Per PRD Section A.5: CSV export functionality
 */
@ObjectType()
export class CSVExportResult {
  @Field()
  url: string;

  @Field()
  filename: string;

  @Field()
  recordCount: number;
}

@Resolver()
export class AdminResolver {
  /**
   * Export Attendance CSV
   * Per PRD: Admin can export attendance data as CSV
   */
  @Query(() => CSVExportResult)
  async exportAttendanceCSV(
    @Arg('programId', () => ID) programId: string,
    @Ctx() ctx: Context
  ): Promise<CSVExportResult> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const approvalRepo = AppDataSource.getRepository(WeeklyAttendanceApproval);

    const admin = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!admin) {
      throw new Error('Admin user not found');
    }

    // Get all teams in program
    const teams = await teamRepo.find({
      where: { programId },
      relations: ['members', 'leader'],
    });

    if (teams.length === 0) {
      throw new Error('No teams found for this program');
    }

    // Get all approved attendance
    const teamIds = teams.map(t => t.id);
    const approvals = await approvalRepo.find({
      where: {
        teamId: In(teamIds),
        status: 'approved',
      },
    });

    const approvedStudentIds = new Set(approvals.map(a => a.studentId));

    // Get attendance records
    const attendance = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.teamId IN (:...teamIds)', { teamIds })
      .andWhere('attendance.userId IN (:...studentIds)', {
        studentIds: Array.from(approvedStudentIds),
      })
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.team', 'team')
      .getMany();

    // Generate CSV
    const csvRows: string[] = [];
    csvRows.push('Date,Student Name,Student ID,Email,Team,Status,Excuse,Check-in Time');

    for (const record of attendance) {
      const date = record.date;
      const studentName = (record as any).user?.name || 'Unknown';
      const studentId = (record as any).user?.studentId || '';
      const email = (record as any).user?.email || '';
      const teamName = (record as any).team?.name || '';
      const status = record.status;
      const excuse = record.excuse || '';
      const timestamp = record.timestamp?.toISOString() || '';

      csvRows.push(
        `"${date}","${studentName}","${studentId}","${email}","${teamName}","${status}","${excuse}","${timestamp}"`
      );
    }

    const csvContent = csvRows.join('\n');

    // Save to file
    const filename = `attendance_export_${programId}_${Date.now()}.csv`;
    const uploadsDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    const filePath = join(uploadsDir, filename);

    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, csvContent, 'utf-8');

    // Track analytics: export_performed (per PRD Section A.5)
    PostHog.trackExportPerformed(admin.id, 'attendance_csv', programId);

    return {
      url: `/uploads/${filename}`,
      filename,
      recordCount: attendance.length,
    };
  }

  /**
   * Get Final Reports
   * Per PRD: Admin can view final reports
   */
  @Query(() => [String])
  async finalReports(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx: Context
  ): Promise<string[]> {
    requireAdminRole(ctx);

    const teamRepo = AppDataSource.getRepository(Team);
    const team = await teamRepo.findOne({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Get documentation files (final reports are stored in team.documentation)
    const reports: string[] = [];
    if (team.documentation && Array.isArray(team.documentation)) {
      team.documentation.forEach((doc: any) => {
        if (doc.type === 'final_report' || doc.type === 'report') {
          reports.push(doc.url);
        }
      });
    }

    return reports;
  }

  /**
   * Download Final Report
   * Per PRD: Admin can download final report files
   */
  @Query(() => String)
  async downloadFinalReport(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('reportUrl') reportUrl: string,
    @Ctx() ctx: Context
  ): Promise<string> {
    requireAdminRole(ctx);

    const teamRepo = AppDataSource.getRepository(Team);
    const team = await teamRepo.findOne({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Verify report exists in team documentation
    if (team.documentation && Array.isArray(team.documentation)) {
      const report = team.documentation.find((doc: any) => doc.url === reportUrl);
      if (!report) {
        throw new Error('Report not found');
      }
    }

    // Return the URL (actual download handled by file serving route)
    return reportUrl;
  }
}

