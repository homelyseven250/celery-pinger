-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "software" TEXT NOT NULL,
    "protocol" INTEGER NOT NULL,
    "onlinePlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "samplePlayers" TEXT[],
    "motd" TEXT NOT NULL,
    "favicon" BYTEA,
    "ip" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);
