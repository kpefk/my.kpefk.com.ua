// E1: scalability benchmark of the PRODUCTION generate()/confirm() code (dist/).
// Usage: POSTGRES_URI=... node e1-bench.js <terms> <groups> <repeats> <outCsv> <phase: seed|bench|all>
const REPO='/sessions/jolly-compassionate-ptolemy/mnt/backend.kpefk.com.ua'
const { randomUUID } = require('crypto')
const { performance } = require('perf_hooks')
const fs = require('fs')
const [,,Ts,Gs,Rs,OUT,PHASE='all'] = process.argv
const T=+Ts, G=+Gs, R=+Rs
const { PrismaService } = require(REPO+'/dist/src/prisma/prisma.service.js')
const { DiplomaSupervisionService } = require(REPO+'/dist/src/curriculum/teacher-load/diploma-supervision.service.js')
const { SubjectAssignmentsService } = require(REPO+'/dist/src/curriculum/teacher-load/subject-assignments.service.js')

async function main(){
  let prisma
  if (process.env.TXMS) { // configuration override documented in the article: raised interactive-transaction timeout
    const { PrismaPg } = require(REPO+'/node_modules/@prisma/adapter-pg')
    const { PrismaClient } = require(REPO+'/node_modules/@prisma/client')
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.POSTGRES_URI }), transactionOptions: { timeout: +process.env.TXMS, maxWait: 10000 } })
  } else prisma = new PrismaService()
  await prisma.$connect()
  const svc = new SubjectAssignmentsService(prisma, new DiplomaSupervisionService(prisma))
  const ids = JSON.parse(fs.existsSync('/tmp/e1-ids.json')?fs.readFileSync('/tmp/e1-ids.json'):'{}')

  if (PHASE==='seed'||PHASE==='all'){
    const specId=randomUUID(), progId=randomUUID(), curId=randomUUID(), verId=randomUUID(), secId=randomUUID(), wcId=randomUUID(), userId=randomUUID()
    await prisma.user.create({data:{id:userId,email:'bench@example.org',password:'x',role:'DEPUTY_DIRECTOR'}})
    await prisma.specialty.create({data:{id:specId,code:'F3',name:'Bench'}})
    await prisma.educationalProgram.create({data:{id:progId,specialtyId:specId,name:'Bench',qualificationName:'Bench'}})
    await prisma.curriculum.create({data:{id:curId,programId:progId,educationForm:'FULL_TIME',admissionBasis:'AFTER_9TH_GRADE',entryYear:2025,studyDurationMonths:34,totalEcts:180}})
    await prisma.curriculumVersion.create({data:{id:verId,curriculumId:curId,versionNumber:1,isPublished:true,publishedAt:new Date()}})
    await prisma.curriculumSection.create({data:{id:secId,versionId:verId,name:'Cycle',orderIndex:1,sectionType:'PROFESSIONAL_COMPETENCY'}})
    // components + terms
    const comps=[], terms=[]
    for(let i=0;i<T;i++){const cid=randomUUID(),tid=randomUUID()
      comps.push({id:cid,sectionId:secId,name:'OK'+i,componentType:'DISCIPLINE',totalEcts:4,totalHours:120,orderIndex:i})
      terms.push({id:tid,componentId:cid,semesterNumber:1+(i%2),ects:4,hours:120})}
    for(let i=0;i<comps.length;i+=1000){await prisma.curriculumComponent.createMany({data:comps.slice(i,i+1000)})}
    for(let i=0;i<terms.length;i+=1000){await prisma.curriculumComponentTerm.createMany({data:terms.slice(i,i+1000)})}
    await prisma.workingCurriculum.create({data:{id:wcId,versionId:verId,academicYear:'2025-2026',semesterNumbers:[1,2]}})
    const wct=terms.map(t=>({id:randomUUID(),workingCurriculumId:wcId,componentTermId:t.id,lectureHours:34,practicalHours:17}))
    for(let i=0;i<wct.length;i+=1000){await prisma.workingCurriculumComponentTerm.createMany({data:wct.slice(i,i+1000)})}
    // groups + assignments + students
    const groups=[...Array(G)].map((_,i)=>({id:randomUUID(),name:'BG-'+i}))
    await prisma.group.createMany({data:groups})
    await prisma.groupCurriculumAssignment.createMany({data:groups.map(g=>({id:randomUUID(),groupId:g.id,curriculumId:curId,versionId:verId,effectiveFrom:new Date(),isActive:true}))})
    const students=[]
    groups.forEach((g,gi)=>{for(let s=0;s<25;s++)students.push({id:randomUUID(),groupId:g.id,educationHistoryActualId:gi*100+s+1,educationId:gi*1000+s,historyTypeId:1,personCodeU:'PC'+gi+'_'+s,personFIO:'S '+s,personId:gi*10000+s,universityId:1})})
    for(let i=0;i<students.length;i+=1000){await prisma.student.createMany({data:students.slice(i,i+1000)})}
    const NT=Math.max(3,Math.ceil(T/3))
    const teachers=[...Array(NT)].map((_,i)=>({id:randomUUID(),personId:900000+i,staffId:900000+i,lastName:'T'+i,firstName:'B',rate:1.5}))
    for(let i=0;i<teachers.length;i+=1000){await prisma.teacher.createMany({data:teachers.slice(i,i+1000)})}
    fs.writeFileSync('/tmp/e1-ids.json',JSON.stringify({wcId,userId,teacherIds:teachers.map(t=>t.id)}))
    console.log('seeded T='+T+' G='+G)
  }

  if (PHASE==='bench'||PHASE==='all'){
    const {wcId,userId,teacherIds}=JSON.parse(fs.readFileSync('/tmp/e1-ids.json'))
    const rows=[]
    const ONLY=process.env.ONLY||'all'
    if(ONLY!=='confirm') for(let r=0;r<R;r++){const t0=performance.now(); await svc.generate(wcId,userId); rows.push({op:'generate',ms:+(performance.now()-t0).toFixed(1)})}
    // assign primary teachers round-robin (raw SQL for speed; not part of timing)
    if(ONLY==='gen'){const hdr='terms,groups,op,ms,extra\n';const csv=rows.map(x=>[T,G,x.op,x.ms,''].join(',')).join('\n')+'\n';fs.appendFileSync(OUT,(fs.existsSync(OUT)&&fs.statSync(OUT).size>0?'':hdr)+csv);console.log(JSON.stringify(rows));await prisma.$disconnect();process.exit(0)}
    const sas=await prisma.teacherLoadSubjectAssignment.findMany({where:{workingCurriculumId:wcId},select:{id:true}})
    const vals=sas.map((s,i)=>`('${s.id}','${teacherIds[i%teacherIds.length]}')`).join(',')
    await prisma.$executeRawUnsafe(`UPDATE teacher_load_subject_assignments t SET primary_teacher_id=v.tid FROM (VALUES ${vals}) AS v(id,tid) WHERE t.id=v.id`)
    for(let r=0;r<Math.min(R,3);r++){
      const t0=performance.now()
      const res=await svc.confirm({workingCurriculumId:wcId,orderNumber:'B-1',orderDate:'2025-08-25'},userId)
      rows.push({op:'confirm',ms:+(performance.now()-t0).toFixed(1),confirmed:res.confirmed,warnings:res.warnings.length})
      await svc.revoke({workingCurriculumId:wcId,reason:'bench'},userId).catch(async e=>{ // revoke signature check
        await prisma.teacherLoadSubjectAssignment.updateMany({where:{workingCurriculumId:wcId},data:{status:'DRAFT',orderNumber:null,orderDate:null,signedByDirectorId:null}})})
    }
    const hdr='terms,groups,op,ms,extra\n'
    const csv=rows.map(x=>[T,G,x.op,x.ms,x.confirmed??''].join(',')).join('\n')+'\n'
    fs.appendFileSync(OUT, (fs.existsSync(OUT)&&fs.statSync(OUT).size>0?'':hdr)+csv)
    console.log(JSON.stringify(rows))
  }
  await prisma.$disconnect(); process.exit(0)
}
main().catch(e=>{console.error('FAIL',e.message.slice(0,400));process.exit(1)})
