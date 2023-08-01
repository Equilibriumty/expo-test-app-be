import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProviderType {
  CLASSIC = 'CLASSIC',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  avatar: string;

  @Column({
    type: 'enum',
    enum: ProviderType,
    default: ProviderType.CLASSIC,
  })
  providerType: ProviderType;

  @Column()
  password: string;

  @Column()
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
