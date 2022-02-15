import * as uuid from 'uuid';
import {Injectable, UnprocessableEntityException} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {EmailService} from "../email/email.service";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "./entities/user.entity";
import {Connection, Repository} from "typeorm";
import {ulid} from "ulid";

@Injectable()
export class UsersService {
    constructor(
        private emailService: EmailService,
        @InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>,
        private connection: Connection,
    ) {

    }

    async create(name: string, email: string, password: string) {
        const userExist = await this.checkUserExists(email);
        if(userExist){
            throw new UnprocessableEntityException('해당 이메일로는 가입할 수 없습니다.');
        }
        const signupVerifyToken = uuid.v1();

        await this.saveUser(name, email, password, signupVerifyToken);
        await this.sendMemberJoinEmail(email, signupVerifyToken);

    }

    async verifyEmail(signupVerifyToken: string): Promise<string> {
        // TODO
        // 1. DB에서 signupVerifyToken으로 회원 가입 처리중인 유저가 있는지 조회하고 없다면 에러 처리
        // 2. 바로 로그인 상태가 되도록 JWT를 발급

        throw new Error('Method not implemented.');
    }

    async login(email: string, password: string): Promise<string> {
        // TODO
        // 1. email, password를 가진 유저가 존재하는지 DB에서 확인하고 없다면 에러 처리
        // 2. JWT를 발급

        throw new Error('Method not implemented.');
    }

    // async getUserInfo(userId: string): Promise<UserInfo> {
    //     // 1. userId를 가진 유저가 존재하는지 DB에서 확인하고 없다면 에러 처리
    //     // 2. 조회된 데이터를 UserInfo 타입으로 응답
    //
    //     throw new Error('Method not implemented.');
    // }

    private async checkUserExists(email: string) {
        const user = await this.usersRepository.findOne({email: email});

        return user !== undefined;
    }

    private async saveUser(name: string, email: string, password: string, signupVerifyToken: string) {
        const user = new UserEntity();
        user.id = ulid();
        user.name = name;
        user.email = email;
        user.password = password;
        user.signupVerifyToken = signupVerifyToken;
        await this.usersRepository.save(user);
    }

    private async saveUserUsingQueryRunner(name: string, email: string, password: string, signupVerifyToken: string) {
        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = new UserEntity();
            user.id = ulid();
            user.name = name;
            user.email = email;
            user.password = password;
            user.signupVerifyToken = signupVerifyToken;

            await queryRunner.manager.save(user);

            // throw new InternalServerErrorException(); // 일부러 에러를 발생시켜 본다

            await queryRunner.commitTransaction();
        } catch (e) {
            // 에러가 발생하면 롤백
            await queryRunner.rollbackTransaction();
        } finally {
            // 직접 생성한 QueryRunner는 해제시켜 주어야 함
            await queryRunner.release();
        }
    }

    private async sendMemberJoinEmail(email: string, signupVerifyToken: string) {
        await this.emailService.sendMemberJoinVerification(email, signupVerifyToken);
    }


}
