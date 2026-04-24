import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './UserDashboard.css';
import './TechnicianDashboard.css';

const RESOURCE_TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const RESOURCE_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE'];
const BOOKING_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const ACTIVE_BOOKING_STATUSES = ['PENDING', 'APPROVED'];

const TICKET_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
};

const dateOffset = (days) => {
  const current = new Date();
  current.setDate(current.getDate() + days);
  return current.toISOString().slice(0, 10);
};

const toMinutes = (time) => {
  const [hour, minute] = String(time || '00:00')
    .split(':')
    .map((value) => Number(value));
  return hour * 60 + minute;
};

const rangesOverlap = (startA, endA, startB, endB) => {
  return Math.max(startA, startB) < Math.min(endA, endB);
};

const badgeClass = (value) => {
  return String(value || 'UNKNOWN').toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

const resourcesCatalogue = [
  {
    id: 'RES-LH-A1',
    name: 'Lecture Hall A1',
    type: 'LECTURE_HALL',
    capacity: 180,
    location: 'Main Academic Block - Floor 1',
    availability: 'Weekdays 08:00 - 18:00',
    status: 'ACTIVE',
  },
  {
    id: 'RES-LAB-DS',
    name: 'Data Science Lab',
    type: 'LAB',
    capacity: 45,
    location: 'Innovation Center - Floor 3',
    availability: 'Weekdays 09:00 - 20:00',
    status: 'ACTIVE',
  },
  {
    id: 'RES-MR-C2',
    name: 'Meeting Room C2',
    type: 'MEETING_ROOM',
    capacity: 12,
    location: 'Admin Building - Floor 2',
    availability: 'Daily 08:00 - 21:00',
    status: 'ACTIVE',
  },
  {
    id: 'RES-EQP-PJ9',
    name: '4K Projector PJ-9',
    type: 'EQUIPMENT',
    capacity: 0,
    location: 'Equipment Store',
    availability: 'Daily 08:00 - 17:00',
    status: 'ACTIVE',
  },
  {
    id: 'RES-EQP-CAM3',
    name: 'DSLR Camera CAM-3',
    type: 'EQUIPMENT',
    capacity: 0,
    location: 'Media Unit',
    availability: 'Weekdays 09:00 - 16:30',
    status: 'OUT_OF_SERVICE',
  },
  {
    id: 'RES-LH-B4',
    name: 'Lecture Hall B4',
    type: 'LECTURE_HALL',
    capacity: 120,
    location: 'Engineering Faculty',
    availability: 'Weekdays 07:30 - 19:00',
    status: 'ACTIVE',
  },
];

const seedBookings = [
  {
    id: 'BK-1001',
    resourceId: 'RES-LH-A1',
    resourceName: 'Lecture Hall A1',
    resourceType: 'LECTURE_HALL',
    resourceLocation: 'Main Academic Block - Floor 1',
    date: dateOffset(1),
    startTime: '09:00',
    endTime: '11:00',
    purpose: 'Software Architecture Workshop',
    attendees: 130,
    status: 'APPROVED',
    decisionReason: 'Approved by admin scheduler.',
    userEmail: 'lecturer@smartcampus.edu',
    requestedBy: 'Lecturer Team',
  },
  {
    id: 'BK-1002',
    resourceId: 'RES-MR-C2',
    resourceName: 'Meeting Room C2',
    resourceType: 'MEETING_ROOM',
    resourceLocation: 'Admin Building - Floor 2',
    date: dateOffset(2),
    startTime: '13:00',
    endTime: '14:30',
    purpose: 'UI Sprint Planning',
    attendees: 9,
    status: 'PENDING',
    decisionReason: '',
    userEmail: 'student@smartcampus.edu',
    requestedBy: 'Student Project Team',
  },
];

const seedTickets = [
  {
    id: 'TKT-5001',
    resourceTarget: 'Data Science Lab / Projector Unit',
    category: 'Equipment Failure',
    description: 'Projector displays flickering output and shuts down intermittently.',
    priority: 'HIGH',
    contact: 'student@smartcampus.edu / +94 77 555 2200',
    attachments: ['error-screen.jpg'],
    status: 'IN_PROGRESS',
    assignedTo: 'Tech Team - Alex',
    resolutionNotes: '',
    rejectedReason: '',
    reporterEmail: 'student@smartcampus.edu',
    reporterName: 'Student Reporter',
    comments: [
      {
        id: 'CM-9001',
        authorEmail: 'student@smartcampus.edu',
        authorName: 'Student Reporter',
        text: 'Issue occurs after about 20 minutes of use.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

const TechnicianDashboard = () => {
  const { user, hasRoles } = useAuth();

  const isAdmin = hasRoles(['ADMIN']);
  const isTechnician = hasRoles(['TECHNICIAN']);
  const canManageTickets = isAdmin || isTechnician;
  const dashboardRoleLabel = isAdmin ? 'ADMIN' : isTechnician ? 'TECHNICIAN' : 'USER';

  const [activeModule, setActiveModule] = useState(() =>
    isTechnician ? 'tickets' : 'catalogue',
  );

  const displayName = useMemo(() => {
    const source = user?.name || user?.fullName || user?.username;
    if (source) {
      return source;
    }

    return user?.email?.split('@')?.[0] || 'User';
  }, [user]);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  const [catalogueFilters, setCatalogueFilters] = useState({
    query: '',
    type: 'ALL',
    minCapacity: '',
    location: '',
    status: 'ALL',
  });

  const filteredResources = useMemo(() => {
    return resourcesCatalogue.filter((item) => {
      if (
        catalogueFilters.query &&
        !`${item.name} ${item.id}`.toLowerCase().includes(catalogueFilters.query.toLowerCase())
      ) {
        return false;
      }

      if (catalogueFilters.type !== 'ALL' && item.type !== catalogueFilters.type) {
        return false;
      }

      if (catalogueFilters.status !== 'ALL' && item.status !== catalogueFilters.status) {
        return false;
      }

      if (
        catalogueFilters.location &&
        !item.location.toLowerCase().includes(catalogueFilters.location.toLowerCase())
      ) {
        return false;
      }

      if (catalogueFilters.minCapacity) {
        const min = Number(catalogueFilters.minCapacity);
        if (!Number.isNaN(min) && item.capacity < min) {
          return false;
        }
      }

      return true;
    });
  }, [catalogueFilters]);

  const bookingIdRef = useRef(2001);
  const [bookings, setBookings] = useState(seedBookings);
  const [bookingForm, setBookingForm] = useState({
    resourceId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
  });
  const [bookingFilters, setBookingFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    location: '',
    mineOnly: !isAdmin,
  });
  const [bookingReviewReason, setBookingReviewReason] = useState({});
  const [bookingError, setBookingError] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  const selectedBookingResource = useMemo(() => {
    return resourcesCatalogue.find((item) => item.id === bookingForm.resourceId) || null;
  }, [bookingForm.resourceId]);

  const visibleBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        if (!isAdmin || bookingFilters.mineOnly) {
          return booking.userEmail === user?.email;
        }
        return true;
      })
      .filter((booking) => {
        if (bookingFilters.status !== 'ALL' && booking.status !== bookingFilters.status) {
          return false;
        }
        if (bookingFilters.type !== 'ALL' && booking.resourceType !== bookingFilters.type) {
          return false;
        }
        if (
          bookingFilters.location &&
          !booking.resourceLocation.toLowerCase().includes(bookingFilters.location.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  }, [bookings, bookingFilters, isAdmin, user?.email]);

  const submitBooking = (event) => {
    event.preventDefault();
    setBookingError('');
    setBookingMessage('');

    if (
      !bookingForm.resourceId ||
      !bookingForm.date ||
      !bookingForm.startTime ||
      !bookingForm.endTime ||
      !bookingForm.purpose.trim()
    ) {
      setBookingError('Please fill all required booking fields.');
      return;
    }

    if (!selectedBookingResource) {
      setBookingError('Selected resource was not found.');
      return;
    }

    if (selectedBookingResource.status !== 'ACTIVE') {
      setBookingError('Selected resource is out of service and cannot be booked.');
      return;
    }

    const start = toMinutes(bookingForm.startTime);
    const end = toMinutes(bookingForm.endTime);
    if (end <= start) {
      setBookingError('End time must be later than start time.');
      return;
    }

    const attendees = Number(bookingForm.attendees || 0);
    if (!Number.isFinite(attendees) || attendees < 0) {
      setBookingError('Expected attendees must be a valid non-negative number.');
      return;
    }

    if (selectedBookingResource.capacity > 0 && attendees > selectedBookingResource.capacity) {
      setBookingError(
        `Attendees exceed resource capacity (${selectedBookingResource.capacity}).`,
      );
      return;
    }

    const hasConflict = bookings.some((booking) => {
      if (booking.resourceId !== bookingForm.resourceId || booking.date !== bookingForm.date) {
        return false;
      }
      if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
        return false;
      }
      return rangesOverlap(
        start,
        end,
        toMinutes(booking.startTime),
        toMinutes(booking.endTime),
      );
    });

    if (hasConflict) {
      setBookingError('Scheduling conflict detected for this resource and time range.');
      return;
    }

    const nextBooking = {
      id: `BK-${bookingIdRef.current++}`,
      resourceId: selectedBookingResource.id,
      resourceName: selectedBookingResource.name,
      resourceType: selectedBookingResource.type,
      resourceLocation: selectedBookingResource.location,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      purpose: bookingForm.purpose.trim(),
      attendees,
      status: 'PENDING',
      decisionReason: '',
      userEmail: user?.email || 'unknown-user@local',
      requestedBy: displayName,
    };

    setBookings((prev) => [nextBooking, ...prev]);
    setBookingForm({
      resourceId: '',
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      attendees: '',
    });
    setBookingMessage('Booking request submitted with PENDING status.');
  };

  const approveBooking = (bookingId) => {
    if (!isAdmin) {
      return;
    }

    const target = bookings.find((item) => item.id === bookingId);
    if (!target || target.status !== 'PENDING') {
      return;
    }

    const targetStart = toMinutes(target.startTime);
    const targetEnd = toMinutes(target.endTime);
    const approvedConflict = bookings.some((item) => {
      if (item.id === bookingId) {
        return false;
      }
      if (item.resourceId !== target.resourceId || item.date !== target.date) {
        return false;
      }
      if (item.status !== 'APPROVED') {
        return false;
      }
      return rangesOverlap(
        targetStart,
        targetEnd,
        toMinutes(item.startTime),
        toMinutes(item.endTime),
      );
    });

    if (approvedConflict) {
      setBookingError('Cannot approve because it overlaps an existing APPROVED booking.');
      return;
    }

    const reason = bookingReviewReason[bookingId]?.trim() || 'Approved by admin.';
    setBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId ? { ...item, status: 'APPROVED', decisionReason: reason } : item,
      ),
    );
    setBookingReviewReason((prev) => ({ ...prev, [bookingId]: '' }));
    setBookingMessage(`Booking ${bookingId} approved.`);
    setBookingError('');
  };

  const rejectBooking = (bookingId) => {
    if (!isAdmin) {
      return;
    }

    const reason = bookingReviewReason[bookingId]?.trim();
    if (!reason) {
      setBookingError('A rejection reason is required.');
      return;
    }

    setBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId ? { ...item, status: 'REJECTED', decisionReason: reason } : item,
      ),
    );
    setBookingReviewReason((prev) => ({ ...prev, [bookingId]: '' }));
    setBookingMessage(`Booking ${bookingId} rejected.`);
    setBookingError('');
  };

  const cancelBooking = (bookingId) => {
    const target = bookings.find((item) => item.id === bookingId);
    if (!target || target.status !== 'APPROVED') {
      return;
    }
    if (target.userEmail !== user?.email) {
      return;
    }

    setBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId
          ? {
              ...item,
              status: 'CANCELLED',
              decisionReason: 'Cancelled by requester.',
            }
          : item,
      ),
    );
    setBookingMessage(`Booking ${bookingId} cancelled.`);
    setBookingError('');
  };

  const ticketIdRef = useRef(6001);
  const commentIdRef = useRef(9901);
  const [tickets, setTickets] = useState(seedTickets);
  const [ticketForm, setTicketForm] = useState({
    resourceTarget: '',
    category: '',
    description: '',
    priority: 'MEDIUM',
    contact: '',
    attachments: [],
  });
  const [ticketFilters, setTicketFilters] = useState({
    status: 'ALL',
    priority: 'ALL',
    mineOnly: !canManageTickets,
  });
  const [ticketInputs, setTicketInputs] = useState({});
  const [ticketCommentDrafts, setTicketCommentDrafts] = useState({});
  const [ticketEditState, setTicketEditState] = useState(null);
  const [ticketError, setTicketError] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const visibleTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        if (!canManageTickets || ticketFilters.mineOnly) {
          return ticket.reporterEmail === user?.email;
        }
        return true;
      })
      .filter((ticket) => {
        if (ticketFilters.status !== 'ALL' && ticket.status !== ticketFilters.status) {
          return false;
        }
        if (ticketFilters.priority !== 'ALL' && ticket.priority !== ticketFilters.priority) {
          return false;
        }
        return true;
      });
  }, [tickets, canManageTickets, ticketFilters, user?.email]);

  const submitTicket = (event) => {
    event.preventDefault();
    setTicketError('');
    setTicketMessage('');

    if (
      !ticketForm.resourceTarget.trim() ||
      !ticketForm.category.trim() ||
      !ticketForm.description.trim() ||
      !ticketForm.contact.trim()
    ) {
      setTicketError('Please complete all required ticket fields.');
      return;
    }

    if (ticketForm.attachments.length > 3) {
      setTicketError('A ticket can include a maximum of 3 image attachments.');
      return;
    }

    const nextTicket = {
      id: `TKT-${ticketIdRef.current++}`,
      resourceTarget: ticketForm.resourceTarget.trim(),
      category: ticketForm.category.trim(),
      description: ticketForm.description.trim(),
      priority: ticketForm.priority,
      contact: ticketForm.contact.trim(),
      attachments: ticketForm.attachments,
      status: 'OPEN',
      assignedTo: '',
      resolutionNotes: '',
      rejectedReason: '',
      reporterEmail: user?.email || 'unknown-user@local',
      reporterName: displayName,
      comments: [],
    };

    setTickets((prev) => [nextTicket, ...prev]);
    setTicketForm({
      resourceTarget: '',
      category: '',
      description: '',
      priority: 'MEDIUM',
      contact: '',
      attachments: [],
    });
    setTicketMessage('Incident ticket created with OPEN status.');
  };

  const updateTicketInput = (ticketId, field, value) => {
    setTicketInputs((prev) => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        [field]: value,
      },
    }));
  };

  const assignTicket = (ticketId) => {
    if (!canManageTickets) {
      return;
    }
    const fallbackAssignee = isTechnician ? displayName : '';
    const assignee = (ticketInputs[ticketId]?.assignee || fallbackAssignee).trim();
    if (!assignee) {
      setTicketError('Please enter technician/staff assignee before assigning.');
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, assignedTo: assignee } : ticket,
      ),
    );
    setTicketMessage(`Ticket ${ticketId} assigned to ${assignee}.`);
    setTicketError('');
  };

  const updateTicketStatus = (ticketId, nextStatus) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || !canManageTickets) {
      return;
    }

    if (!TICKET_TRANSITIONS[ticket.status]?.includes(nextStatus)) {
      return;
    }

    if (nextStatus === 'REJECTED' && !isAdmin) {
      setTicketError('Only admin users can reject tickets.');
      return;
    }

    const resolutionNotes = ticketInputs[ticketId]?.resolutionNotes?.trim() || '';
    const rejectedReason = ticketInputs[ticketId]?.rejectedReason?.trim() || '';
    const assignee = ticketInputs[ticketId]?.assignee?.trim() || ticket.assignedTo || '';

    if (nextStatus === 'RESOLVED' && !resolutionNotes) {
      setTicketError('Resolution notes are required to mark a ticket as RESOLVED.');
      return;
    }

    if (nextStatus === 'REJECTED' && !rejectedReason) {
      setTicketError('Rejection reason is required when rejecting a ticket.');
      return;
    }

    setTickets((prev) =>
      prev.map((item) => {
        if (item.id !== ticketId) {
          return item;
        }

        return {
          ...item,
          status: nextStatus,
          assignedTo:
            item.assignedTo ||
            assignee ||
            (isTechnician ? displayName : item.assignedTo),
          resolutionNotes:
            nextStatus === 'RESOLVED' || nextStatus === 'CLOSED'
              ? resolutionNotes || item.resolutionNotes
              : item.resolutionNotes,
          rejectedReason: nextStatus === 'REJECTED' ? rejectedReason : item.rejectedReason,
        };
      }),
    );

    setTicketMessage(`Ticket ${ticketId} moved to ${nextStatus}.`);
    setTicketError('');
  };

  const addComment = (ticketId) => {
    const value = (ticketCommentDrafts[ticketId] || '').trim();
    if (!value) {
      return;
    }

    const nextComment = {
      id: `CM-${commentIdRef.current++}`,
      authorEmail: user?.email || 'unknown-user@local',
      authorName: displayName,
      text: value,
      createdAt: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, comments: [...ticket.comments, nextComment] }
          : ticket,
      ),
    );
    setTicketCommentDrafts((prev) => ({ ...prev, [ticketId]: '' }));
  };

  const startEditComment = (ticketId, comment) => {
    setTicketEditState({
      ticketId,
      commentId: comment.id,
      text: comment.text,
    });
  };

  const saveEditedComment = () => {
    if (!ticketEditState) {
      return;
    }

    const value = ticketEditState.text.trim();
    if (!value) {
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== ticketEditState.ticketId) {
          return ticket;
        }

        return {
          ...ticket,
          comments: ticket.comments.map((comment) =>
            comment.id === ticketEditState.commentId ? { ...comment, text: value } : comment,
          ),
        };
      }),
    );
    setTicketEditState(null);
  };

  const deleteComment = (ticketId, commentId) => {
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== ticketId) {
          return ticket;
        }

        return {
          ...ticket,
          comments: ticket.comments.filter((comment) => comment.id !== commentId),
        };
      }),
    );
  };

  const normalizedDisplayName = displayName.trim().toLowerCase();
  const isAssignedToCurrentTechnician = (ticket) => {
    if (!normalizedDisplayName) {
      return false;
    }
    return String(ticket.assignedTo || '').toLowerCase().includes(normalizedDisplayName);
  };

  const myBookingsCount = bookings.filter((booking) => booking.userEmail === user?.email).length;
  const myOpenTicketsCount = tickets.filter(
    (ticket) =>
      ticket.reporterEmail === user?.email &&
      ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(ticket.status),
  ).length;
  const openQueueCount = tickets.filter((ticket) => ticket.status === 'OPEN').length;
  const inProgressQueueCount = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
  const unassignedQueueCount = tickets.filter(
    (ticket) => ticket.status === 'OPEN' && !ticket.assignedTo,
  ).length;
  const assignedToMeCount = tickets.filter(
    (ticket) =>
      ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(ticket.status) &&
      isAssignedToCurrentTechnician(ticket),
  ).length;
  const criticalQueueCount = tickets.filter(
    (ticket) =>
      ticket.priority === 'CRITICAL' &&
      ['OPEN', 'IN_PROGRESS'].includes(ticket.status),
  ).length;
  const summaryCards = isTechnician
    ? [
        {
          label: 'Open Queue',
          value: openQueueCount,
          hint: 'Tickets waiting for technician action.',
        },
        {
          label: 'In Progress',
          value: inProgressQueueCount,
          hint: 'Active work currently underway.',
        },
        {
          label: 'Unassigned',
          value: unassignedQueueCount,
          hint: 'Open incidents without an assignee.',
        },
        {
          label: 'Assigned to Me',
          value: assignedToMeCount,
          hint: 'My active and recently resolved tickets.',
        },
      ]
    : [
        {
          label: 'Catalogue Items',
          value: resourcesCatalogue.length,
          hint: 'Facilities and assets available in the system.',
        },
        {
          label: 'My Bookings',
          value: myBookingsCount,
          hint: 'Current and past booking requests.',
        },
        {
          label: 'My Open Tickets',
          value: myOpenTicketsCount,
          hint: 'Tickets still in OPEN, IN_PROGRESS, or RESOLVED.',
        },
      ];

  return (
    <section className={isTechnician ? 'udash-root udash-root-tech' : 'udash-root'}>

      <div className="udash-wrap">
        <header className={isTechnician ? 'udash-hero udash-hero-tech' : 'udash-hero'}>
          <p className="udash-kicker">
            {isTechnician ? 'Smart Campus Technician Dashboard' : 'Smart Campus User Dashboard'}
          </p>
          <h1>{isTechnician ? `Incident Operations Hub, ${displayName}` : `Welcome, ${displayName}`}</h1>
          <p>
            {isTechnician
              ? 'Manage maintenance and incident lifecycles end-to-end, from triage and assignment to closure with clear visibility of operational queues.'
              : 'Resource discovery, booking operations, and incident ticketing are now integrated in one place with role-aware workflows.'}
          </p>
          <div className="udash-meta-row">
            <span className="udash-pill">{today}</span>
            <span className="udash-pill">Role: {dashboardRoleLabel}</span>
            {isTechnician ? (
              <span className="udash-pill">Critical Queue: {criticalQueueCount}</span>
            ) : null}
          </div>
        </header>

        <section className={isTechnician ? 'udash-summary udash-summary-tech' : 'udash-summary'}>
          {summaryCards.map((card) => (
            <div className="udash-stat" key={card.label}>
              <h3>{card.label}</h3>
              <strong>{card.value}</strong>
              <span className="udash-small">{card.hint}</span>
            </div>
          ))}
        </section>

        {isTechnician ? (
          <section className="udash-tech-actions" aria-label="Technician quick actions">
            <button
              type="button"
              className="udash-tech-action"
              onClick={() => {
                setActiveModule('tickets');
                setTicketFilters((prev) => ({ ...prev, status: 'OPEN', mineOnly: false }));
              }}
            >
              Review OPEN Queue
            </button>
            <button
              type="button"
              className="udash-tech-action"
              onClick={() => {
                setActiveModule('tickets');
                setTicketFilters((prev) => ({ ...prev, status: 'IN_PROGRESS', mineOnly: false }));
              }}
            >
              Continue IN_PROGRESS Work
            </button>
            <button
              type="button"
              className="udash-tech-action"
              onClick={() => {
                setActiveModule('tickets');
                setTicketFilters((prev) => ({ ...prev, status: 'ALL', mineOnly: false }));
              }}
            >
              View Full Ticket Queue
            </button>
            <button
              type="button"
              className="udash-tech-action"
              onClick={() => {
                setActiveModule('catalogue');
              }}
            >
              Inspect Facilities & Assets
            </button>
          </section>
        ) : null}

        <nav className="udash-tabs" aria-label="Dashboard modules">
          <button
            type="button"
            className={activeModule === 'catalogue' ? 'udash-tab udash-tab-active' : 'udash-tab'}
            onClick={() => setActiveModule('catalogue')}
          >
            Facilities & Assets
          </button>
          <button
            type="button"
            className={activeModule === 'bookings' ? 'udash-tab udash-tab-active' : 'udash-tab'}
            onClick={() => setActiveModule('bookings')}
          >
            Booking Management
          </button>
          <button
            type="button"
            className={activeModule === 'tickets' ? 'udash-tab udash-tab-active' : 'udash-tab'}
            onClick={() => setActiveModule('tickets')}
          >
            Maintenance & Ticketing
          </button>
        </nav>

        {activeModule === 'catalogue' ? (
          <section className="udash-grid">
            <article className="udash-card udash-grid-wide">
              <h2>Facilities & Assets Catalogue</h2>
              <div className="udash-form-grid">
                <label className="udash-field">
                  Search
                  <input
                    className="udash-input"
                    type="text"
                    placeholder="Search by resource name or ID"
                    value={catalogueFilters.query}
                    onChange={(event) =>
                      setCatalogueFilters((prev) => ({ ...prev, query: event.target.value }))
                    }
                  />
                </label>
                <label className="udash-field">
                  Type
                  <select
                    className="udash-select"
                    value={catalogueFilters.type}
                    onChange={(event) =>
                      setCatalogueFilters((prev) => ({ ...prev, type: event.target.value }))
                    }
                  >
                    <option value="ALL">All Types</option>
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="udash-field">
                  Min Capacity
                  <input
                    className="udash-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={catalogueFilters.minCapacity}
                    onChange={(event) =>
                      setCatalogueFilters((prev) => ({
                        ...prev,
                        minCapacity: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="udash-field">
                  Location
                  <input
                    className="udash-input"
                    type="text"
                    placeholder="Filter by location"
                    value={catalogueFilters.location}
                    onChange={(event) =>
                      setCatalogueFilters((prev) => ({ ...prev, location: event.target.value }))
                    }
                  />
                </label>
                <label className="udash-field">
                  Status
                  <select
                    className="udash-select"
                    value={catalogueFilters.status}
                    onChange={(event) =>
                      setCatalogueFilters((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="ALL">All Statuses</option>
                    {RESOURCE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>

            <article className="udash-card udash-grid-wide">
              <h2>Available Resources ({filteredResources.length})</h2>
              <ul className="udash-list">
                {filteredResources.map((item) => (
                  <li className="udash-item" key={item.id}>
                    <div className="udash-item-head">
                      <h3>{item.name}</h3>
                      <span className={`udash-badge ${badgeClass(item.status)}`}>{item.status}</span>
                    </div>
                    <div className="udash-item-meta">
                      <strong>{item.type}</strong> | Capacity:{' '}
                      {item.capacity > 0 ? item.capacity : 'N/A'} | {item.location}
                    </div>
                    <div className="udash-item-meta">Availability: {item.availability}</div>
                    <div className="udash-small">ID: {item.id}</div>
                  </li>
                ))}
                {filteredResources.length === 0 ? (
                  <li className="udash-item">No resources match current filters.</li>
                ) : null}
              </ul>
            </article>
          </section>
        ) : null}

        {activeModule === 'bookings' ? (
          <section className="udash-grid">
            <article className="udash-card">
              <h2>Request Booking</h2>
              <form onSubmit={submitBooking}>
                <div className="udash-form-grid">
                  <label className="udash-field">
                    Resource
                    <select
                      className="udash-select"
                      value={bookingForm.resourceId}
                      onChange={(event) =>
                        setBookingForm((prev) => ({ ...prev, resourceId: event.target.value }))
                      }
                    >
                      <option value="">Select a resource</option>
                      {resourcesCatalogue.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.type})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="udash-field">
                    Date
                    <input
                      className="udash-input"
                      type="date"
                      value={bookingForm.date}
                      onChange={(event) =>
                        setBookingForm((prev) => ({ ...prev, date: event.target.value }))
                      }
                    />
                  </label>

                  <label className="udash-field">
                    Expected Attendees
                    <input
                      className="udash-input"
                      type="number"
                      min="0"
                      value={bookingForm.attendees}
                      onChange={(event) =>
                        setBookingForm((prev) => ({ ...prev, attendees: event.target.value }))
                      }
                    />
                  </label>

                  <label className="udash-field">
                    Start Time
                    <input
                      className="udash-input"
                      type="time"
                      value={bookingForm.startTime}
                      onChange={(event) =>
                        setBookingForm((prev) => ({ ...prev, startTime: event.target.value }))
                      }
                    />
                  </label>

                  <label className="udash-field">
                    End Time
                    <input
                      className="udash-input"
                      type="time"
                      value={bookingForm.endTime}
                      onChange={(event) =>
                        setBookingForm((prev) => ({ ...prev, endTime: event.target.value }))
                      }
                    />
                  </label>

                  <label className="udash-field">
                    Purpose
                    <input
                      className="udash-input"
                      type="text"
                      placeholder="Why do you need this resource?"
                      value={bookingForm.purpose}
                      onChange={(event) =>
                        setBookingForm((prev) => ({ ...prev, purpose: event.target.value }))
                      }
                    />
                  </label>
                </div>

                {selectedBookingResource ? (
                  <div className="udash-small" style={{ marginTop: '8px' }}>
                    Selected resource capacity: {selectedBookingResource.capacity || 'N/A'} | Status:{' '}
                    {selectedBookingResource.status}
                  </div>
                ) : null}

                <div className="udash-actions">
                  <button type="submit" className="udash-btn">
                    Submit Booking Request
                  </button>
                </div>
              </form>

              {bookingMessage ? <div className="udash-message">{bookingMessage}</div> : null}
              {bookingError ? <div className="udash-error">{bookingError}</div> : null}
            </article>

            <article className="udash-card">
              <h2>Booking Filters</h2>
              <div className="udash-form-grid">
                <label className="udash-field">
                  Status
                  <select
                    className="udash-select"
                    value={bookingFilters.status}
                    onChange={(event) =>
                      setBookingFilters((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="ALL">All</option>
                    {BOOKING_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="udash-field">
                  Resource Type
                  <select
                    className="udash-select"
                    value={bookingFilters.type}
                    onChange={(event) =>
                      setBookingFilters((prev) => ({ ...prev, type: event.target.value }))
                    }
                  >
                    <option value="ALL">All Types</option>
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="udash-field">
                  Location
                  <input
                    className="udash-input"
                    type="text"
                    placeholder="Search location"
                    value={bookingFilters.location}
                    onChange={(event) =>
                      setBookingFilters((prev) => ({ ...prev, location: event.target.value }))
                    }
                  />
                </label>
              </div>

              {isAdmin ? (
                <label className="udash-field" style={{ marginTop: '10px' }}>
                  <span>Admin Scope</span>
                  <select
                    className="udash-select"
                    value={bookingFilters.mineOnly ? 'MINE' : 'ALL'}
                    onChange={(event) =>
                      setBookingFilters((prev) => ({
                        ...prev,
                        mineOnly: event.target.value === 'MINE',
                      }))
                    }
                  >
                    <option value="ALL">Show all bookings</option>
                    <option value="MINE">Show only my bookings</option>
                  </select>
                </label>
              ) : null}
            </article>

            <article className="udash-card udash-grid-wide">
              <h2>{isAdmin && !bookingFilters.mineOnly ? 'All Bookings' : 'My Bookings'}</h2>
              <ul className="udash-list">
                {visibleBookings.map((booking) => (
                  <li className="udash-item" key={booking.id}>
                    <div className="udash-item-head">
                      <h3>
                        {booking.resourceName} ({booking.resourceType})
                      </h3>
                      <span className={`udash-badge ${badgeClass(booking.status)}`}>{booking.status}</span>
                    </div>
                    <div className="udash-item-meta">
                      {booking.date} | {booking.startTime} - {booking.endTime} | {booking.resourceLocation}
                    </div>
                    <div className="udash-item-meta">
                      Purpose: {booking.purpose} | Attendees:{' '}
                      {booking.attendees > 0 ? booking.attendees : 'N/A'}
                    </div>
                    <div className="udash-small">
                      Booking ID: {booking.id} | Requested by: {booking.requestedBy}
                    </div>
                    {booking.decisionReason ? (
                      <div className="udash-small">Note: {booking.decisionReason}</div>
                    ) : null}

                    {isAdmin && booking.status === 'PENDING' ? (
                      <div className="udash-actions">
                        <input
                          className="udash-input"
                          type="text"
                          placeholder="Approval/rejection reason"
                          value={bookingReviewReason[booking.id] || ''}
                          onChange={(event) =>
                            setBookingReviewReason((prev) => ({
                              ...prev,
                              [booking.id]: event.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="udash-btn"
                          onClick={() => approveBooking(booking.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="udash-btn udash-btn-danger"
                          onClick={() => rejectBooking(booking.id)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}

                    {booking.status === 'APPROVED' && booking.userEmail === user?.email ? (
                      <div className="udash-actions">
                        <button
                          type="button"
                          className="udash-btn udash-btn-outline"
                          onClick={() => cancelBooking(booking.id)}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
                {visibleBookings.length === 0 ? (
                  <li className="udash-item">No bookings found for current view.</li>
                ) : null}
              </ul>
            </article>
          </section>
        ) : null}

        {activeModule === 'tickets' ? (
          <section className="udash-grid">
            <article className="udash-card">
              <h2>Maintenance & Incident Ticketing</h2>
              <form onSubmit={submitTicket}>
                <div className="udash-form-grid">
                  <label className="udash-field">
                    Resource / Location
                    <input
                      className="udash-input"
                      type="text"
                      placeholder="e.g., Lecture Hall A1 / Rear projector"
                      value={ticketForm.resourceTarget}
                      onChange={(event) =>
                        setTicketForm((prev) => ({ ...prev, resourceTarget: event.target.value }))
                      }
                    />
                  </label>

                  <label className="udash-field">
                    Category
                    <input
                      className="udash-input"
                      type="text"
                      placeholder="e.g., Network, Equipment, Safety"
                      value={ticketForm.category}
                      onChange={(event) =>
                        setTicketForm((prev) => ({ ...prev, category: event.target.value }))
                      }
                    />
                  </label>

                  <label className="udash-field">
                    Priority
                    <select
                      className="udash-select"
                      value={ticketForm.priority}
                      onChange={(event) =>
                        setTicketForm((prev) => ({ ...prev, priority: event.target.value }))
                      }
                    >
                      {TICKET_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="udash-two-col" style={{ marginTop: '10px' }}>
                  <label className="udash-field">
                    Description
                    <textarea
                      className="udash-textarea"
                      placeholder="Describe what happened and impact."
                      value={ticketForm.description}
                      onChange={(event) =>
                        setTicketForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>

                  <label className="udash-field">
                    Preferred Contact Details
                    <textarea
                      className="udash-textarea"
                      placeholder="Phone / email / preferred contact window"
                      value={ticketForm.contact}
                      onChange={(event) =>
                        setTicketForm((prev) => ({ ...prev, contact: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <label className="udash-field" style={{ marginTop: '10px' }}>
                  Image Attachments (max 3)
                  <input
                    className="udash-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      if (files.length > 3) {
                        setTicketError('Please select up to 3 images only.');
                        setTicketForm((prev) => ({ ...prev, attachments: files.slice(0, 3).map((f) => f.name) }));
                        return;
                      }
                      setTicketError('');
                      setTicketForm((prev) => ({ ...prev, attachments: files.map((f) => f.name) }));
                    }}
                  />
                </label>

                {ticketForm.attachments.length > 0 ? (
                  <div className="udash-attachments">
                    {ticketForm.attachments.map((name) => (
                      <span className="udash-attachment" key={name}>
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="udash-actions">
                  <button type="submit" className="udash-btn">
                    Create Ticket
                  </button>
                </div>
              </form>

              {ticketMessage ? <div className="udash-message">{ticketMessage}</div> : null}
              {ticketError ? <div className="udash-error">{ticketError}</div> : null}
            </article>

            <article className="udash-card">
              <h2>Ticket Filters</h2>
              <div className="udash-form-grid">
                <label className="udash-field">
                  Status
                  <select
                    className="udash-select"
                    value={ticketFilters.status}
                    onChange={(event) =>
                      setTicketFilters((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="ALL">All</option>
                    {TICKET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="udash-field">
                  Priority
                  <select
                    className="udash-select"
                    value={ticketFilters.priority}
                    onChange={(event) =>
                      setTicketFilters((prev) => ({ ...prev, priority: event.target.value }))
                    }
                  >
                    <option value="ALL">All</option>
                    {TICKET_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {canManageTickets ? (
                <label className="udash-field" style={{ marginTop: '10px' }}>
                  Visibility Scope
                  <select
                    className="udash-select"
                    value={ticketFilters.mineOnly ? 'MINE' : 'ALL'}
                    onChange={(event) =>
                      setTicketFilters((prev) => ({ ...prev, mineOnly: event.target.value === 'MINE' }))
                    }
                  >
                    <option value="ALL">Show all tickets</option>
                    <option value="MINE">Show my reported tickets</option>
                  </select>
                </label>
              ) : null}
            </article>

            <article className="udash-card udash-grid-wide">
              <h2>
                {isTechnician && !ticketFilters.mineOnly
                  ? 'Technician Ticket Queue'
                  : canManageTickets && !ticketFilters.mineOnly
                    ? 'All Tickets'
                    : 'My Tickets'}
              </h2>
              <ul className="udash-list">
                {visibleTickets.map((ticket) => {
                  const commentDraft = ticketCommentDrafts[ticket.id] || '';
                  const nextActions = TICKET_TRANSITIONS[ticket.status] || [];

                  return (
                    <li className="udash-item" key={ticket.id}>
                      <div className="udash-item-head">
                        <h3>{ticket.resourceTarget}</h3>
                        <span className={`udash-badge ${badgeClass(ticket.status)}`}>{ticket.status}</span>
                      </div>
                      <div className="udash-item-meta">
                        {ticket.category} | Priority: {ticket.priority} | Reported by {ticket.reporterName}
                      </div>
                      <div className="udash-item-meta">{ticket.description}</div>
                      <div className="udash-small">Ticket ID: {ticket.id} | Contact: {ticket.contact}</div>
                      <div className="udash-small">
                        Assigned to: {ticket.assignedTo || 'Not assigned yet'}
                      </div>
                      {ticket.resolutionNotes ? (
                        <div className="udash-small">Resolution Notes: {ticket.resolutionNotes}</div>
                      ) : null}
                      {ticket.rejectedReason ? (
                        <div className="udash-small">Rejection Reason: {ticket.rejectedReason}</div>
                      ) : null}

                      {ticket.attachments.length > 0 ? (
                        <div className="udash-attachments">
                          {ticket.attachments.map((attachment) => (
                            <span className="udash-attachment" key={`${ticket.id}-${attachment}`}>
                              {attachment}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {canManageTickets ? (
                        <div className="udash-comments">
                          <h3>{isTechnician ? 'Technician Actions' : 'Staff Actions'}</h3>
                          <div className="udash-two-col">
                            <label className="udash-field">
                              Technician / Staff
                              <input
                                className="udash-input"
                                type="text"
                                placeholder="Assignee name"
                                value={ticketInputs[ticket.id]?.assignee || ''}
                                onChange={(event) =>
                                  updateTicketInput(ticket.id, 'assignee', event.target.value)
                                }
                              />
                            </label>

                            <label className="udash-field">
                              Resolution Notes
                              <input
                                className="udash-input"
                                type="text"
                                placeholder="Required for RESOLVED"
                                value={ticketInputs[ticket.id]?.resolutionNotes || ''}
                                onChange={(event) =>
                                  updateTicketInput(ticket.id, 'resolutionNotes', event.target.value)
                                }
                              />
                            </label>
                          </div>

                          {isAdmin && nextActions.includes('REJECTED') ? (
                            <label className="udash-field">
                              Rejection Reason
                              <input
                                className="udash-input"
                                type="text"
                                placeholder="Required if rejected"
                                value={ticketInputs[ticket.id]?.rejectedReason || ''}
                                onChange={(event) =>
                                  updateTicketInput(ticket.id, 'rejectedReason', event.target.value)
                                }
                              />
                            </label>
                          ) : null}

                          <div className="udash-actions">
                            <button
                              type="button"
                              className="udash-btn udash-btn-outline"
                              onClick={() => assignTicket(ticket.id)}
                            >
                              Assign
                            </button>

                            {nextActions.includes('IN_PROGRESS') ? (
                              <button
                                type="button"
                                className="udash-btn"
                                onClick={() => updateTicketStatus(ticket.id, 'IN_PROGRESS')}
                              >
                                Move to IN_PROGRESS
                              </button>
                            ) : null}

                            {nextActions.includes('RESOLVED') ? (
                              <button
                                type="button"
                                className="udash-btn"
                                onClick={() => updateTicketStatus(ticket.id, 'RESOLVED')}
                              >
                                Move to RESOLVED
                              </button>
                            ) : null}

                            {nextActions.includes('CLOSED') ? (
                              <button
                                type="button"
                                className="udash-btn"
                                onClick={() => updateTicketStatus(ticket.id, 'CLOSED')}
                              >
                                Move to CLOSED
                              </button>
                            ) : null}

                            {isAdmin && nextActions.includes('REJECTED') ? (
                              <button
                                type="button"
                                className="udash-btn udash-btn-danger"
                                onClick={() => updateTicketStatus(ticket.id, 'REJECTED')}
                              >
                                Reject Ticket
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      <div className="udash-comments">
                        <h3>Comments</h3>
                        {ticket.comments.map((comment) => {
                          const isOwner = comment.authorEmail === user?.email;
                          const canEdit = isOwner;
                          const canDelete = isOwner || isAdmin;
                          const editing =
                            ticketEditState?.ticketId === ticket.id &&
                            ticketEditState?.commentId === comment.id;

                          return (
                            <div className="udash-comment" key={comment.id}>
                              <div className="udash-comment-header">
                                <strong>{comment.authorName}</strong>
                                <span className="udash-small">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>

                              {editing ? (
                                <>
                                  <textarea
                                    className="udash-textarea"
                                    value={ticketEditState.text}
                                    onChange={(event) =>
                                      setTicketEditState((prev) =>
                                        prev ? { ...prev, text: event.target.value } : prev,
                                      )
                                    }
                                  />
                                  <div className="udash-actions">
                                    <button type="button" className="udash-btn" onClick={saveEditedComment}>
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="udash-btn udash-btn-outline"
                                      onClick={() => setTicketEditState(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="udash-item-meta">{comment.text}</div>
                                  {(canEdit || canDelete) ? (
                                    <div className="udash-actions">
                                      {canEdit ? (
                                        <button
                                          type="button"
                                          className="udash-btn udash-btn-outline"
                                          onClick={() => startEditComment(ticket.id, comment)}
                                        >
                                          Edit
                                        </button>
                                      ) : null}
                                      {canDelete ? (
                                        <button
                                          type="button"
                                          className="udash-btn udash-btn-danger"
                                          onClick={() => deleteComment(ticket.id, comment.id)}
                                        >
                                          Delete
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          );
                        })}

                        {ticket.comments.length === 0 ? (
                          <div className="udash-small">No comments yet.</div>
                        ) : null}

                        <div className="udash-two-col">
                          <label className="udash-field">
                            Add Comment
                            <textarea
                              className="udash-textarea"
                              value={commentDraft}
                              onChange={(event) =>
                                setTicketCommentDrafts((prev) => ({
                                  ...prev,
                                  [ticket.id]: event.target.value,
                                }))
                              }
                              placeholder="Share progress or follow-up details."
                            />
                          </label>
                        </div>

                        <div className="udash-actions">
                          <button type="button" className="udash-btn" onClick={() => addComment(ticket.id)}>
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}

                {visibleTickets.length === 0 ? (
                  <li className="udash-item">No tickets found for current filter scope.</li>
                ) : null}
              </ul>
            </article>
          </section>
        ) : null}
      </div>
    </section>
  );
};

export default TechnicianDashboard;
