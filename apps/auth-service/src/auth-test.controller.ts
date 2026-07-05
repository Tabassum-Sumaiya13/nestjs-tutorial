import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Schema } from 'mongoose';
import { apiResponse } from '@app/common-lib';

// Define a simple User schema
const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: true },
);

@Controller('auth-test')
export class AuthTestController {
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const conn = req.tenantConnection;
    const User = conn.model('User', UserSchema);
    const created = await new User(body).save();
    return apiResponse('User created (tenant scoped)', created);
  }

  @Get()
  async findAll(@Req() req: any) {
    const conn = req.tenantConnection;
    const User = conn.model('User', UserSchema);
    const users = await User.find().lean().exec();
    return apiResponse('Users list (tenant scoped)', users);
  }
}