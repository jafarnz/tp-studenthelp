/*
  Warnings:

  - You are about to drop the column `read` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `colorScheme` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `socialLinks` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- AlterTable
ALTER TABLE `connection` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `message` DROP COLUMN `read`,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    MODIFY `content` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `colorScheme`,
    DROP COLUMN `socialLinks`;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
