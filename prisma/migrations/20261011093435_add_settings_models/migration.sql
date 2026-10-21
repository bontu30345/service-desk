-- CreateTable
CREATE TABLE "UserNotificationPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticketAssignedInApp" BOOLEAN NOT NULL DEFAULT true,
    "ticketAssignedEmail" BOOLEAN NOT NULL DEFAULT true,
    "newCommentInApp" BOOLEAN NOT NULL DEFAULT true,
    "newCommentEmail" BOOLEAN NOT NULL DEFAULT true,
    "ticketStatusUpdatedInApp" BOOLEAN NOT NULL DEFAULT true,
    "ticketStatusUpdatedEmail" BOOLEAN NOT NULL DEFAULT true,
    "slaAlertsInApp" BOOLEAN NOT NULL DEFAULT true,
    "slaAlertsEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceSetting" (
    "key" TEXT NOT NULL DEFAULT 'default',
    "workspaceName" TEXT NOT NULL DEFAULT 'Service Desk',
    "supportEmail" TEXT NOT NULL DEFAULT '',
    "defaultTicketPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "autoAssignment" BOOLEAN NOT NULL DEFAULT false,
    "brandColor" TEXT NOT NULL DEFAULT '#2563EB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPreference_userId_key" ON "UserNotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "UserNotificationPreference" ADD CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
