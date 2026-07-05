import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
  // LOGIN → Validate credentials & send OTP
  // ───────────────────────────────
  async login(req: any, dto: LoginDto) {
    try {
      const conn = req.tenantConnection;
      if (!conn) {
        this.logger.warn(
          `❌ Tenant connection missing (tenantId=${req.tenantId})`,
        );
        return apiResponse(
          'Login failed: Tenant environment is not initialized. Please retry after selecting the correct workspace.',
          null,
          {
            status: 'error',
            code: 'TENANT_CONNECTION_MISSING',
            details: { tenantId: req.tenantId },
          },
        );
      }

      const User = conn.model('User', UserSchema);
      const user = await User.findOne({
        $or: [
          { username: dto.usernameOrEmailOrMobile },
          { email: dto.usernameOrEmailOrMobile },
          { mobile: dto.usernameOrEmailOrMobile },
        ],
      });

      if (!user) {
        this.logger.warn(
          `❌ Login failed: user not found for ${dto.usernameOrEmailOrMobile} (tenantId=${req.tenantId})`,
        );
        return apiResponse(
          'Invalid credentials. Please check your username, email, or mobile number and try again.',
          null,
          {
            status: 'error',
            code: 'INVALID_CREDENTIALS',
            field: 'usernameOrEmailOrMobile',
          },
        );
      }

      if (user.status === 0) {
        this.logger.warn(`🔒 Locked account tried to login: ${user.email}`);
        return apiResponse(
          'Your account is currently locked. Please check your email for unlock instructions or contact support.',
          null,
          {
            status: 'error',
            code: 'ACCOUNT_LOCKED',
            email: user.email,
          },
        );
      }

      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) {
        this.logger.warn(`❌ Invalid password for user ${user.email}`);
        return apiResponse(
          'Incorrect password. Please try again or reset your password if forgotten.',
          null,
          {
            status: 'error',
            code: 'INVALID_PASSWORD',
            field: 'password',
          },
        );
      }

      await this.redis.del(`login:fail:${req.tenantId}:${user._id}`);

      const loginId = uuidv4();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await this.redis.set(
        `otp:login:${loginId}`,
        JSON.stringify({ userId: user._id, otp }),
        300,
      );

      try {
        await this.mailer.sendMail(
          user.email,
          'DARMIST Lab Login OTP',
          otpLoginTemplate,
          { name: user.name, otp, year: new Date().getFullYear() },
          `Your DARMIST Lab OTP is ${otp}`,
        );
        this.logger.log(`📧 OTP sent to ${user.email} (loginId=${loginId})`);
      } catch (mailErr) {
        this.logger.error(
          `📧 Failed to send OTP email to ${user.email}`,
          mailErr.stack,
        );
        return apiResponse(
          'We could not send the OTP to your email at this moment. Please try again later.',
          null,
          {
            status: 'error',
            code: 'OTP_SEND_FAILED',
            error: mailErr.message,
          },
        );
      }

      return apiResponse(
        'A verification OTP has been sent to your registered email address. Please check your inbox.',
        {
          loginId,
          channel: 'email',
          maskedEmail: this.maskEmail(user.email),
        },
        {
          status: 'success',
          code: 'OTP_SENT',
        },
      );
    } catch (err: any) {
      this.logger.error(`❌ Unexpected login error`, err.stack || err);
      return apiResponse(
        'Login failed due to a system error. Please try again later.',
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
  // VERIFY OTP → Issue tokens + Save session
  // ───────────────────────────────
  async verifyOtp(req: any, dto: VerifyOtpDto) {
    try {
      const conn = req.tenantConnection;
      if (!conn) {
        this.logger.warn(
          `❌ Tenant connection missing (tenantId=${req.tenantId})`,
        );
        return apiResponse(
          'OTP verification failed: Tenant environment not initialized. Please retry.',
          null,
          {
            status: 'error',
            code: 'TENANT_CONNECTION_MISSING',
            details: { tenantId: req.tenantId },
          },
        );
      }

      const data = await this.redis.get(`otp:login:${dto.loginId}`);
      if (!data) {
        this.logger.warn(
          `❌ OTP expired or invalid (loginId=${dto.loginId}, tenantId=${req.tenantId})`,
        );
        return apiResponse(
          'Your OTP has expired or is invalid. Please request a new OTP to continue.',
          null,
          {
            status: 'error',
            code: 'OTP_EXPIRED_OR_INVALID',
            loginId: dto.loginId,
          },
        );
      }

      let parsed: { userId: string; otp: string };
      try {
        parsed = JSON.parse(
          typeof data === 'string' ? data : JSON.stringify(data),
        );
      } catch (err) {
        this.logger.error(
          `❌ Failed to parse OTP data (loginId=${dto.loginId})`,
          (err as any)?.stack || '',
        );
        return apiResponse(
          'Verification failed due to corrupted OTP data. Please try again.',
          null,
          {
            status: 'error',
            code: 'OTP_DATA_CORRUPTED',
            loginId: dto.loginId,
          },
        );
      }

      const { userId, otp } = parsed;
      const User = conn.model('User', UserSchema);
      const user = await User.findById(userId);

      if (!user) {
        this.logger.warn(
          `❌ OTP verification failed: user not found (userId=${userId}, tenantId=${req.tenantId})`,
        );
        return apiResponse(
          'User not found. Please reinitiate the login process.',
          null,
          {
            status: 'error',
            code: 'USER_NOT_FOUND',
            userId,
          },
        );
      }

      if (dto.otp !== otp) {
        this.logger.warn(
          `❌ OTP mismatch for user ${user.email} (tenantId=${req.tenantId}, provided=${dto.otp}, expected=${otp})`,
        );
        return apiResponse(
          'Incorrect OTP entered. Please check and try again.',
          null,
          {
            status: 'error',
            code: 'INVALID_OTP',
            field: 'otp',
          },
        );
      }

      await this.redis.del(`otp:login:${dto.loginId}`);

      const sessionId = uuidv4();
      const payload = {
        sub: String(user._id),
        tenantId: req.tenantId,
        username: user.username,
        role: user.role,
        sid: sessionId,
      };

      const accessToken = this.jwt.sign(payload, {
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      });
      const refreshToken = this.jwt.sign(payload, {
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      });

      const crypto = await import('crypto');
      const refreshHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const session = {
        sessionId,
        deviceName: req.headers?.['user-agent'] || 'Unknown',
        ip: req.ip || req.connection?.remoteAddress || 'N/A',
        ua: req.headers?.['user-agent'] || 'Unknown',
        refreshHash,
        createdAt: new Date(),
        lastSeen: new Date(),
      };

      await User.updateOne({ _id: user._id }, { $push: { sessions: session } });

      this.logger.log(
        `✅ User ${user.email} logged in successfully (tenantId=${req.tenantId}, sessionId=${sessionId})`,
      );

      return apiResponse(
        'You have successfully logged in to DARMIST Lab.',
        {
          accessToken,
          refreshToken,
          sessionId,
          user: { id: user._id, username: user.username, role: user.role },
        },
        {
          status: 'success',
          code: 'LOGIN_SUCCESS',
        },
      );
    } catch (err: any) {
      this.logger.error(
        `❌ Unexpected error in verifyOtp (tenantId=${req.tenantId}, loginId=${dto.loginId})`,
        err?.stack || err,
      );
      return apiResponse(
        'Login verification failed due to an unexpected system error. Please try again later.',
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
  // HELPERS
  // ───────────────────────────────
  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    return name[0] + '***@' + domain;
  }

  async signup(req: any, dto: SignupDto) {
    const tenantConnection = req.tenantConnection;
    if (!tenantConnection) {
      throw new BadRequestException('Missing tenant connection');
    }

    const UserModel = tenantConnection.model('User', UserSchema);

    const existing = await UserModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    })
      .lean()
      .exec();

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const user = await new UserModel({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      mobile: dto.mobile,
      password: dto.password,
      role: 'user',
    }).save();

    try {
      await this.mailer.sendMail(
        dto.email,
        'Welcome to Darmist',
        '<h1>Welcome!</h1><p>Your account has been created successfully.</p>',
        { name: dto.name, username: dto.username },
        `Welcome ${dto.name}! Your account has been created successfully.`,
      );
    } catch (error) {
      this.logger.warn(
        `Welcome email could not be sent: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      message:
        'Your account has been created successfully. You can now log in to your workspace.',
      data: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      meta: {
        status: 'success',
        code: 'USER_CREATED',
      },
      ts: new Date().toISOString(),
    };
  }
}
