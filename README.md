# 🎨 실시간 드로잉 게임 플랫폼 - 구동 가이드

본 프로젝트는 실시간 소켓 통신 기반의 드로잉 게임입니다.  
NestJS와 React를 사용하여 백엔드와 프론트엔드를 개발하였으며, 로컬 환경에서 실행됩니다.



## 🛠️ 1. 요구 사항

로컬에서 프로젝트를 실행하려면 다음 소프트웨어가 설치되어 있어야 합니다.

- **Node.js** `v18.17.1` 이상  
  👉 [https://nodejs.org](https://nodejs.org)  
- **npm** (Node.js 설치 시 함께 설치됨)
- **MongoDB Atlas** 계정 또는 로컬 MongoDB 설치



## 📁 2. 프로젝트 구조

```
catch_mind/
├── backend-nest/       # 백엔드 - NestJS
└── frontend/           # 프론트엔드 - React + Vite
```


## 🔧 2.1 백엔드 실행 (NestJS)

### ✅ 1) 디렉터리 이동

```bash
cd backend-nest
```

### ✅ 2) 의존성 설치

```bash
npm install
```

### ✅ 3) 필요 패키지 설치 명령어

```bash
npm install @nestjs/common @nestjs/core @nestjs/jwt @nestjs/mongoose \
@nestjs/passport @nestjs/platform-express @nestjs/websockets \
mongoose passport passport-jwt reflect-metadata rxjs socket.io \
class-transformer class-validator
```

### ✅ 4) 환경변수 설정

`backend-nest` 디렉토리에 `.env` 파일을 생성하고 아래 내용을 입력합니다:

```
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/catchmind?retryWrites=true&w=majority&appName=Cluster0

PORT=9999

JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_EXPIRATION=3600s
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_REFRESH_EXPIRATION=7d
```

> 🔒 `your_username`과 `your_password`는 MongoDB Atlas 계정 정보로 입력해 주세요.


### ✅ 5) 서버 실행

```bash
npm start
```

> 서버는 [http://localhost:9999](http://localhost:9999) 에서 실행됩니다.

---

## 💻 2.2 프론트엔드 실행 (React + Vite)

### ✅ 1) 디렉터리 이동

```bash
cd frontend
```

### ✅ 2) 의존성 설치

```bash
npm install
```

### ✅ 3) 필요 패키지 설치 명령어

```bash
npm install axios classnames react react-dom react-router-dom socket.io-client
```

### ✅ 4) 환경변수 설정

`frontend` 디렉토리에 `.env` 파일을 생성하고 아래 내용을 입력합니다:

```
VITE_API_URL=http://localhost:9999
```

### ✅ 5) 프론트엔드 실행

```bash
npm run dev
```

> 프론트는 [http://localhost:3000](http://localhost:3000) 또는 [http://localhost:5173](http://localhost:5173)에서 실행됩니다.



## 🧪 3. 테스트 방법 (2인 이상 플레이 시)

현재 본 프로젝트는 **실제 배포 서버 없이 로컬 환경에서만 실행됩니다.**  
따라서 2인 이상 테스트를 위해 다음과 같이 **두 개의 브라우저를 사용**해 주세요:

- **Chrome 브라우저에서 접속**: [http://localhost:3000](http://localhost:3000)
- **Microsoft Edge 브라우저에서 접속**: [http://localhost:3000](http://localhost:3000)

각 브라우저에서 **회원가입 후 로그인**하면, 두 명의 사용자처럼 게임 방에 입장하고 플레이를 테스트할 수 있습니다.



## 📂 GitHub 저장소

👉 [https://github.com/choiyunaa/catch_mind](https://github.com/choiyunaa/catch_mind)

> 프로젝트 전체 소스코드는 위 저장소에서 확인하실 수 있습니다.

> 👩‍💻 팀명: 호두 좋아  
> 👤 팀원: 전희주 (202537790), 최윤아 (202053789)
