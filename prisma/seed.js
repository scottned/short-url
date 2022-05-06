const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Can't use createMany with sqlite

  await prisma.urls.create({
    data: { short: 'abcd', target: 'https://remix.run/docs/en/v1/tutorials/blog' }
  })

  await prisma.urls.create({
    data: { short: 'qwerty', target: 'https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781' }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
