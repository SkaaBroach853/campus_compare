create extension if not exists "pgcrypto";

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  fees integer not null,
  rating numeric not null check (rating >= 0 and rating <= 5),
  placement_percent integer not null check (placement_percent >= 60 and placement_percent <= 100),
  description text not null,
  image_url text not null,
  courses text[] not null default '{}',
  created_at timestamp without time zone not null default now()
);

create table if not exists public.saved_colleges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  created_at timestamp without time zone not null default now(),
  unique (user_id, college_id)
);

alter table public.colleges enable row level security;
alter table public.saved_colleges enable row level security;

create policy "Colleges are readable by everyone"
  on public.colleges for select
  using (true);

create policy "Users can read their saved colleges"
  on public.saved_colleges for select
  using (auth.uid() = user_id);

create policy "Users can save colleges"
  on public.saved_colleges for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their saved colleges"
  on public.saved_colleges for delete
  using (auth.uid() = user_id);

insert into public.colleges (name, location, fees, rating, placement_percent, description, image_url, courses)
values
  ('IIT Bombay', 'Mumbai, Maharashtra', 220000, 4.9, 96, 'IIT Bombay is one of India''s most selective engineering institutes, known for research, entrepreneurship, and exceptional placements across technology, consulting, and core engineering roles.', 'https://placehold.co/600x400?text=IIT+Bombay', array['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering']),
  ('IIT Delhi', 'Delhi', 225000, 4.9, 95, 'IIT Delhi combines rigorous academics with a strong startup ecosystem and industry-linked research opportunities in the National Capital Region.', 'https://placehold.co/600x400?text=IIT+Delhi', array['Computer Science', 'Electrical Engineering', 'Civil Engineering', 'Production Engineering']),
  ('BITS Pilani', 'Pilani, Rajasthan', 475000, 4.7, 92, 'BITS Pilani is a private deemed university with flexible academics, strong alumni networks, and excellent placements for engineering and science programs.', 'https://placehold.co/600x400?text=BITS+Pilani', array['Computer Science', 'Electronics', 'Mechanical Engineering', 'Pharmacy']),
  ('VJTI', 'Mumbai, Maharashtra', 85000, 4.4, 88, 'Veermata Jijabai Technological Institute is a historic Mumbai engineering college with strong industry access and practical technical education.', 'https://placehold.co/600x400?text=VJTI', array['Computer Engineering', 'Information Technology', 'Textile Engineering', 'Civil Engineering']),
  ('COEP', 'Pune, Maharashtra', 95000, 4.5, 87, 'COEP Technological University is among India''s oldest engineering institutions, valued for its academic depth, campus culture, and Pune industry connections.', 'https://placehold.co/600x400?text=COEP', array['Computer Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Robotics']),
  ('SPIT', 'Mumbai, Maharashtra', 180000, 4.3, 86, 'Sardar Patel Institute of Technology is known for focused engineering programs, active technical communities, and consistent Mumbai-based placements.', 'https://placehold.co/600x400?text=SPIT', array['Computer Engineering', 'Information Technology', 'Electronics', 'Data Science']),
  ('NIT Trichy', 'Tiruchirappalli, Tamil Nadu', 175000, 4.8, 94, 'NIT Trichy is a premier national institute with broad engineering strengths, strong placements, and a vibrant residential campus.', 'https://placehold.co/600x400?text=NIT+Trichy', array['Computer Science', 'Electronics', 'Mechanical Engineering', 'Architecture']),
  ('VIT Vellore', 'Vellore, Tamil Nadu', 198000, 4.2, 82, 'VIT Vellore offers a large multidisciplinary campus, flexible credit system, and broad recruiting coverage across technology companies.', 'https://placehold.co/600x400?text=VIT+Vellore', array['Computer Science', 'Biotechnology', 'Electronics', 'Civil Engineering']),
  ('Manipal Institute of Technology', 'Manipal, Karnataka', 335000, 4.2, 80, 'Manipal Institute of Technology provides a global campus environment, modern facilities, and strong opportunities in engineering and applied sciences.', 'https://placehold.co/600x400?text=Manipal', array['Computer Science', 'Mechatronics', 'Aeronautical Engineering', 'Biomedical Engineering']),
  ('NMIMS', 'Mumbai, Maharashtra', 325000, 4.1, 78, 'NMIMS offers professional programs with a strong Mumbai presence, management exposure, and growing technology and analytics pathways.', 'https://placehold.co/600x400?text=NMIMS', array['Computer Engineering', 'Data Science', 'Business Analytics', 'Management Studies']),
  ('SRM Institute of Science and Technology', 'Chennai, Tamil Nadu', 250000, 4.0, 76, 'SRM is a large private university with broad engineering programs, international collaborations, and diverse campus opportunities.', 'https://placehold.co/600x400?text=SRM', array['Computer Science', 'Electronics', 'Automobile Engineering', 'Biotechnology']),
  ('Thapar Institute of Engineering and Technology', 'Patiala, Punjab', 410000, 4.3, 84, 'Thapar is a respected private engineering university known for strong academics, industry relationships, and a well-developed residential campus.', 'https://placehold.co/600x400?text=Thapar', array['Computer Engineering', 'Electronics', 'Mechanical Engineering', 'Chemical Engineering']),
  ('IIIT Hyderabad', 'Hyderabad, Telangana', 360000, 4.8, 97, 'IIIT Hyderabad is renowned for computer science, AI, and research-focused education with outstanding product and research placements.', 'https://placehold.co/600x400?text=IIIT+Hyderabad', array['Computer Science', 'Electronics', 'Computational Linguistics', 'AI and ML']),
  ('DTU', 'Delhi', 190000, 4.5, 89, 'Delhi Technological University has a strong engineering legacy, active student culture, and robust placements across technology and core sectors.', 'https://placehold.co/600x400?text=DTU', array['Computer Engineering', 'Software Engineering', 'Mechanical Engineering', 'Environmental Engineering']),
  ('Jadavpur University', 'Kolkata, West Bengal', 12000, 4.6, 85, 'Jadavpur University is known for exceptional academic value, strong engineering departments, and a rich intellectual campus environment.', 'https://placehold.co/600x400?text=Jadavpur+University', array['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'])
on conflict do nothing;
