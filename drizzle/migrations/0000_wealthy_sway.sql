CREATE TABLE `better_auth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `better_auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `better_auth_jwks` (
	`id` text PRIMARY KEY NOT NULL,
	`publicKey` text NOT NULL,
	`privateKey` text NOT NULL,
	`createdAt` integer NOT NULL,
	`expiresAt` integer
);
--> statement-breakpoint
CREATE TABLE `better_auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `better_auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `better_auth_session_token_unique` ON `better_auth_session` (`token`);--> statement-breakpoint
CREATE TABLE `better_auth_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`githubUserId` text,
	`githubUsername` text,
	`banned` integer DEFAULT false,
	`roles` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `better_auth_user_email_unique` ON `better_auth_user` (`email`);--> statement-breakpoint
CREATE TABLE `better_auth_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hostLinks` (
	`id` text PRIMARY KEY NOT NULL,
	`showId` text NOT NULL,
	`showHostId` text NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`notes` text,
	FOREIGN KEY (`showId`) REFERENCES `shows`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`showHostId`) REFERENCES `showHosts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `host_links_by_show_host` ON `hostLinks` (`showId`,`showHostId`);--> statement-breakpoint
CREATE TABLE `showHosts` (
	`id` text PRIMARY KEY NOT NULL,
	`showId` text NOT NULL,
	`hostId` text NOT NULL,
	`displayName` text NOT NULL,
	`lowerThirdTitle` text,
	FOREIGN KEY (`showId`) REFERENCES `shows`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hostId`) REFERENCES `better_auth_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `show_hosts_by_show_host` ON `showHosts` (`showId`,`hostId`);--> statement-breakpoint
CREATE TABLE `shows` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`startsAt` integer NOT NULL,
	`endedAt` integer,
	`createdAt` integer NOT NULL,
	`createdById` text NOT NULL,
	FOREIGN KEY (`createdById`) REFERENCES `better_auth_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `shows_by_status` ON `shows` (`status`);--> statement-breakpoint
CREATE INDEX `shows_by_starts_at` ON `shows` (`startsAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `shows_one_live` ON `shows` (`status`) WHERE "shows"."status" = 'live';