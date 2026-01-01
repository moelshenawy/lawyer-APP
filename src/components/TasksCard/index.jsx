import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getTasks } from "@/api/user";
import TaskCard from "@/components/TaskCard";
import Skeleton from "@/components/Skeleton";
import styles from "@/pages/Home.module.scss";

const PRIORITY_SCORE = {
  urgent: 3,
  high: 2,
  normal: 1,
};

// supports different api keys just in case (priority / level)
const getTaskPriority = (task) => String(task?.priority ?? task?.level ?? "normal").toLowerCase();

const sortByPriority = (list) =>
  list
    .map((task, idx) => ({ task, idx }))
    .sort((a, b) => {
      const pa = PRIORITY_SCORE[getTaskPriority(a.task)] ?? 1;
      const pb = PRIORITY_SCORE[getTaskPriority(b.task)] ?? 1;
      // urgent first
      if (pb !== pa) return pb - pa;
      // keep stable order for same priority
      return a.idx - b.idx;
    })
    .map(({ task }) => task);

/**
 * TasksCard component that displays a list of tasks with filtering and search
 * Used in both Home and Tasks pages.
 */
const TasksCard = ({ searchQuery = "", statusFilter = "all" }) => {
  const { lng } = useParams();
  const { t } = useTranslation("orders");
  const base = `/${lng || "ar"}`;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await getTasks();
        if (isMounted) {
          const taskData = response.data?.data || response.data || [];
          setTasks(Array.isArray(taskData) ? taskData : []);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        if (isMounted) setError(t("fetchTasksFailed"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // ✅ urgent > high > normal
    return sortByPriority(filtered);
  }, [tasks, searchQuery, statusFilter]);

  // Group tasks by status if showing all and no search query
  const groupedTasks = useMemo(() => {
    if (statusFilter !== "all" || searchQuery) return null;

    const groups = {
      todo: { title: t("todoTitle"), tasks: [] },
      in_progress: { title: t("inProgressTitle"), tasks: [] },
      done: { title: t("doneTitle"), tasks: [] },
      blocked: { title: t("blockedTitle"), tasks: [] },
    };

    tasks.forEach((task) => {
      if (groups[task.status]) groups[task.status].tasks.push(task);
    });

    // ✅ sort inside each group: urgent > high > normal
    Object.values(groups).forEach((g) => {
      g.tasks = sortByPriority(g.tasks);
    });

    return Object.entries(groups).filter(([, group]) => group.tasks.length > 0);
  }, [tasks, statusFilter, searchQuery, t]);

  if (loading) {
    return (
      <div className={styles.taskGroups}>
        <div className={styles.taskGroup}>
          <Skeleton variant="text" width="40%" height={24} className="mb-4" />
          <div className="flex flex-col gap-3">
            <TaskCard.Skeleton />
            <TaskCard.Skeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  if (filteredTasks.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
        <p className="text-gray-500">{t("noTasks")}</p>
      </div>
    );
  }

  return (
    <div className={styles.taskGroups}>
      {groupedTasks ? (
        groupedTasks.map(([key, group]) => (
          <div key={key} className={styles.taskGroup}>
            <div className={styles.taskGroupHeader}>
              <h3>{group.title}</h3>
              <Link to={`${base}/tasks`} className={styles.moreLink}>
                {t("viewAll")}
              </Link>
            </div>
            <div className={styles.taskList}>
              {group.tasks.map((task) => (
                <TaskCard key={task.id} task={task} linkTo={`${base}/task/${task.id}`} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={styles.taskList}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} linkTo={`${base}/task/${task.id}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksCard;

// import React, { useEffect, useState, useMemo } from "react";
// import { Link, useParams } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { getTasks } from "@/api/user";
// import TaskCard from "@/components/TaskCard";
// import Skeleton from "@/components/Skeleton";
// import styles from "@/pages/Home.module.scss";

// /**
//  * TasksCard component that displays a list of tasks with filtering and search
//  * Used in both Home and Tasks pages.
//  */
// const TasksCard = ({ searchQuery = "", statusFilter = "all" }) => {
//   const { lng } = useParams();
//   const { t } = useTranslation("orders");
//   const base = `/${lng || "ar"}`;
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchTasks = async () => {
//       setLoading(true);
//       try {
//         const response = await getTasks();
//         if (isMounted) {
//           // Verify the structure of the API response
//           const taskData = response.data?.data || response.data || [];
//           setTasks(Array.isArray(taskData) ? taskData : []);
//           setError(null);
//         }
//       } catch (err) {
//         console.error("Error fetching tasks:", err);
//         if (isMounted) {
//           setError(t("fetchTasksFailed"));
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     fetchTasks();
//     return () => {
//       isMounted = false;
//     };
//   }, [t]);

//   const filteredTasks = useMemo(() => {
//     return tasks.filter((task) => {
//       const matchesSearch =
//         !searchQuery ||
//         task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         task.description?.toLowerCase().includes(searchQuery.toLowerCase());

//       const matchesStatus =
//         statusFilter === "all" || task.status === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [tasks, searchQuery, statusFilter]);

//   // Group tasks by status if showing all and no search query
//   const groupedTasks = useMemo(() => {
//     if (statusFilter !== "all" || searchQuery) return null;

//     const groups = {
//       todo: { title: t("todoTitle"), tasks: [] },
//       in_progress: { title: t("inProgressTitle"), tasks: [] },
//       done: { title: t("doneTitle"), tasks: [] },
//       blocked: { title: t("blockedTitle"), tasks: [] },
//     };

//     tasks.forEach((task) => {
//       if (groups[task.status]) {
//         groups[task.status].tasks.push(task);
//       }
//     });

//     return Object.entries(groups).filter(([, group]) => group.tasks.length > 0);
//   }, [tasks, statusFilter, searchQuery, t]);

//   if (loading) {
//     return (
//       <div className={styles.taskGroups}>
//         <div className={styles.taskGroup}>
//           <Skeleton variant="text" width="40%" height={24} className="mb-4" />
//           <div className="flex flex-col gap-3">
//             <TaskCard.Skeleton />
//             <TaskCard.Skeleton />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-4 text-center text-red-500">{error}</div>;
//   }

//   if (filteredTasks.length === 0) {
//     return (
//       <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
//         <p className="text-gray-500">{t("noTasks")}</p>
//       </div>
//     );
//   }

//   return (
//     <div className={styles.taskGroups}>
//       {groupedTasks ? (
//         groupedTasks.map(([key, group]) => (
//           <div key={key} className={styles.taskGroup}>
//             <div className={styles.taskGroupHeader}>
//               <h3>{group.title}</h3>
//               <Link to={`${base}/tasks`} className={styles.moreLink}>
//                 {t("viewAll")}
//               </Link>
//             </div>
//             <div className={styles.taskList}>
//               {group.tasks.map((task) => (
//                 <TaskCard
//                   key={task.id}
//                   task={task}
//                   linkTo={`${base}/task/${task.id}`}
//                 />
//               ))}
//             </div>
//           </div>
//         ))
//       ) : (
//         <div className={styles.taskList}>
//           {filteredTasks.map((task) => (
//             <TaskCard
//               key={task.id}
//               task={task}
//               linkTo={`${base}/task/${task.id}`}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default TasksCard;
