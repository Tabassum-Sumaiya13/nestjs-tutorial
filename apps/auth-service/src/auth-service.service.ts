// auth-service.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { apiResponse } from '@app/common-lib';
import { SignupDto } from './dto/signup.dto';
import { UserSchema } from './schemas/user.schema';
import { EmailLibService } from '@app/email-lib';
import * as bcrypt from 'bcrypt';
import { welcomeTemplate } from '@app/email-lib/templates/welcome.template';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RedisLibService } from '@app/redis-lib';
import { otpLoginTemplate } from '@app/email-lib/templates/otp-login.template';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    private readonly mailer: EmailLibService,
    private readonly redis: RedisLibService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ───────────────────────────────
  // SIGNUP → Create new user
  // ───────────────────────────────
  async signup(req: any, dto: SignupDto) {
    try {
      const conn = req.tenantConnection;
      if (!conn) {
        this.logger.warn(
          `❌ Tenant connection missing (tenantId=${req.tenantId})`,
        );
        return apiResponse(
          'Signup failed: Tenant environment is not initialized. Please retry after selecting the correct workspace.',
          null,
          {
            status: 'error',
            code: 'TENANT_CONNECTION_MISSING',
            details: { tenantId: req.tenantId },
          },
        );
      }

      const User = conn.model('User', UserSchema);

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: dto.email },
          { username: dto.username },
          { mobile: dto.mobile },
        ],
      });

      if (existingUser) {
        const field =
          existingUser.email === dto.email
            ? 'email'
            : existingUser.username === dto.username
              ? 'username'
              : 'mobile';
        this.logger.warn(
          `❌ Signup failed: ${field} already exists (${dto[field]}) for tenant ${req.tenantId}`,
        );
        return apiResponse(
          `This ${field} is already registered. Please use a different ${field} or login.`,
          null,
          {
            status: 'error',
            code: 'USER_EXISTS',
            field: field,
            [field]: dto[field],
          },
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create user
      const user = new User({
        name: dto.name,
        username: dto.username,
        email: dto.email,
        mobile: dto.mobile,
        password: hashedPassword,
        role: 'user',
        status: 1,
        sessions: [],
      });

      await user.save();

      this.logger.log(
        `✅ New user registered: ${user.email} (tenantId=${req.tenantId})`,
      );

      // Send welcome email (optional)
      try {
        await this.mailer.sendMail(
          user.email,
          'Welcome to DARMIST Lab! 🎉',
          welcomeTemplate,
          {
            name: user.name,
            email: user.email,
            year: new Date().getFullYear(),
          },
          `Welcome to DARMIST Lab! Your account has been created successfully.`,
        );
        this.logger.log(`📧 Welcome email sent to ${user.email}`);
      } catch (mailErr) {
        this.logger.warn(
          `⚠️ Welcome email failed but user created: ${user.email}`,
          mailErr.message,
        );
        // Don't fail the signup if email fails
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user.toObject();

      return apiResponse(
        'Account created successfully! Please login to continue.',
        {
          user: userWithoutPassword,
          nextStep: 'login',
          loginUrl: '/auth/login',
        },
        {
          status: 'success',
          code: 'SIGNUP_SUCCESS',
        },
      );
    } catch (err: any) {
      this.logger.error(
        `❌ Unexpected error during signup (tenantId=${req.tenantId})`,
        err.stack || err,
      );

      // Handle duplicate key errors from MongoDB
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return apiResponse(
          `This ${field} is already taken. Please use a different one.`,
          null,
          {
            status: 'error',
            code: 'DUPLICATE_KEY',
            field: field,
          },
        );
      }

      return apiResponse(
        'Signup failed due to a system error. Please try again later.',
        null,
        {
          status: 'error',
          code: 'INTERNAL_ERROR',
          error: err.message || 'Unknown error',
        },
      );
    }
  }

  // ───────────────────────────────
  // LOGIN → Validate credentials & send OTP
  // ───────────────────────────────
  async login(req: any, dto: LoginDto) {
    // ... existing login code
  }

  // ───────────────────────────────
  // VERIFY OTP → Issue tokens + Save session
  // ───────────────────────────────
  async verifyOtp(req: any, dto: VerifyOtpDto) {
    // ... existing verify OTP code
  }

  // ───────────────────────────────
  // HELPERS
  // ───────────────────────────────
  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    return name[0] + '***@' + domain;
  }
}
